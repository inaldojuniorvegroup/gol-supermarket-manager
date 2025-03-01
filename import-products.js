import { read, utils } from 'xlsx';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function importProducts() {
  try {
    console.log('Iniciando processo de importação...');

    // Ler o arquivo Excel
    const excelBuffer = readFileSync('attached_assets/JULINA FOODS (3).xlsx');
    const workbook = read(excelBuffer);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const products = utils.sheet_to_json(worksheet);

    console.log(`Total de produtos encontrados no Excel: ${products.length}`);
    console.log('Amostra do primeiro produto:', JSON.stringify(products[0], null, 2));

    // Mapear os produtos para o formato esperado pela API
    const mappedProducts = products.map((row) => {
      const mapped = {
        name: String(row['Nome'] || '').trim(),
        itemCode: String(row['Código'] || '').trim(),
        supplierCode: String(row['Cód.Forn.'] || '').trim(),
        barCode: String(row['Cód.Barra'] || '').trim(),
        description: String(row['Departamento'] || '').trim(),
        unitPrice: Number(String(row['Preço Compra'] || '0').replace(',', '.')),
        boxPrice: Number(String(row['Preço Caixa'] || '0').replace(',', '.')),
        boxQuantity: Number(String(row['Qtd/Caixa'] || '1').replace(',', '.')),
        unit: String(row['Unid.'] || 'un').trim(),
        distributorId: 3, // ID do JULINA FOODS
        imageUrl: null,
        isSpecialOffer: false
      };

      console.log(`Mapeando produto ${mapped.name}:`, mapped);
      return mapped;
    });

    // Remover produtos sem nome ou código
    const validProducts = mappedProducts.filter(p => {
      if (!p.name || !p.itemCode) {
        console.log(`Produto inválido (sem nome ou código):`, p);
        return false;
      }
      return true;
    });

    console.log(`\nProdutos válidos encontrados: ${validProducts.length}`);

    // Processar em lotes menores
    const batchSize = 10;
    let totalImported = 0;
    let totalErrors = 0;

    for (let i = 0; i < validProducts.length; i += batchSize) {
      const batch = validProducts.slice(i, i + batchSize);
      console.log(`\nProcessando lote ${Math.floor(i/batchSize) + 1} de ${Math.ceil(validProducts.length/batchSize)}`);

      try {
        const response = await fetch('http://localhost:5000/api/products/import', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(batch)
        });

        if (!response.ok) {
          const error = await response.text();
          console.error(`Erro no lote ${Math.floor(i/batchSize) + 1}:`, error);
          totalErrors += batch.length;
          console.log('Produtos do lote que falharam:', JSON.stringify(batch, null, 2));
        } else {
          const result = await response.json();
          console.log(`Resultado do lote ${Math.floor(i/batchSize) + 1}:`, result);
          totalImported += result.productsImported || 0;

          if (result.success && result.success.length > 0) {
            console.log('IDs dos produtos importados:', result.success);
          }

          if (result.errors && result.errors.length > 0) {
            console.log('Erros detalhados:', result.errors);
          }
        }
      } catch (error) {
        console.error(`\nErro ao processar lote ${Math.floor(i/batchSize) + 1}:`, error);
        console.error('Stack trace:', error.stack);
        totalErrors += batch.length;
      }

      // Pequena pausa entre os lotes
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('\nResumo da importação:');
    console.log(`Total de produtos no arquivo: ${validProducts.length}`);
    console.log(`Produtos importados com sucesso: ${totalImported}`);
    console.log(`Produtos com erro: ${totalErrors}`);

  } catch (error) {
    console.error('\nErro crítico durante a importação:', error);
    console.error('Stack trace:', error.stack);
  }
}

importProducts();