import { read, utils } from 'xlsx';
import { readFileSync } from 'fs';
import fetch from 'node-fetch';

async function importProducts() {
  try {
    console.log('Iniciando processo de importação...');

    // Ler o arquivo Excel
    const excelBuffer = readFileSync('attached_assets/Export (5).xlsx');
    const workbook = read(excelBuffer);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const products = utils.sheet_to_json(worksheet);

    console.log(`Total de produtos encontrados no Excel: ${products.length}`);

    // Mapear os produtos para o formato esperado pela API
    const mappedProducts = products.map((row) => ({
      name: String(row['Nome'] || '').trim(),
      itemCode: String(row['Código'] || '').trim(),
      supplierCode: String(row['Cód.Forn.'] || '').trim(),
      barCode: String(row['Cód.Barra'] || '').trim(),
      description: String(row['Departamento'] || '').trim(),
      unitPrice: Number(String(row['Preço Compra'] || '0').replace(',', '.')),
      boxPrice: Number(String(row['Preço Caixa'] || '0').replace(',', '.')),
      boxQuantity: Number(String(row['Qtd/Caixa'] || '1').replace(',', '.')),
      unit: String(row['Unid.'] || 'un').trim(),
      distributorId: 1, // ID do E B EXPRESS PROVISIONS INC
      imageUrl: null,
      isSpecialOffer: false
    }));

    // Remover produtos sem nome ou código
    const validProducts = mappedProducts.filter(p => p.name && p.itemCode);

    console.log(`\nProdutos válidos encontrados: ${validProducts.length}`);

    // Processar em lotes menores (25 produtos por vez para evitar timeout)
    const batchSize = 25;
    let totalImported = 0;
    let totalSkipped = 0;
    let totalErrors = 0;

    // Processar os lotes
    for (let i = 0; i < validProducts.length; i += batchSize) {
      const batch = validProducts.slice(i, i + batchSize);
      const currentBatch = Math.floor(i/batchSize) + 1;
      const totalBatches = Math.ceil(validProducts.length/batchSize);

      console.log(`\nProcessando lote ${currentBatch} de ${totalBatches}`);
      console.log(`Produtos no lote: ${batch.length}`);

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
          console.error(`Erro no lote ${currentBatch}:`, error);
          totalErrors += batch.length;
        } else {
          const result = await response.json();
          console.log(`Resultado do lote ${currentBatch}:`, result);
          totalImported += result.productsImported || 0;
          totalSkipped += result.productsSkipped || 0;

          // Mostrar progresso
          const progress = ((i + batch.length) / validProducts.length * 100).toFixed(1);
          console.log(`Progresso: ${progress}% completo`);
        }
      } catch (error) {
        console.error(`\nErro ao processar lote ${currentBatch}:`, error);
        totalErrors += batch.length;
      }

      // Pequena pausa entre os lotes para não sobrecarregar
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('\nResumo da importação:');
    console.log(`Total de produtos no arquivo: ${validProducts.length}`);
    console.log(`Produtos importados com sucesso: ${totalImported}`);
    console.log(`Produtos ignorados (já existem): ${totalSkipped}`);
    console.log(`Produtos com erro: ${totalErrors}`);

  } catch (error) {
    console.error('\nErro crítico durante a importação:', error);
  }
}

importProducts();