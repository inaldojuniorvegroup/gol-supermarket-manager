import { read, utils } from 'xlsx';
import fs from 'fs';

async function importProducts() {
  try {
    // Ler o arquivo Excel
    const excelBuffer = fs.readFileSync('attached_assets/JULINA FOODS (3).xlsx');
    const workbook = read(excelBuffer);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const products = utils.sheet_to_json(worksheet);

    console.log(`Total de produtos encontrados: ${products.length}`);

    // Processar em lotes
    const batchSize = 50;
    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize);

      for (const row of batch) {
        const product = {
          name: String(row['Nome'] || '').trim(),
          itemCode: String(row['Código'] || '').trim(),
          supplierCode: String(row['Cód.Forn.'] || '').trim(),
          barCode: String(row['Cód.Barra'] || '').trim(),
          description: String(row['Departamento'] || '').trim(),
          grupo: String(row['Grupo'] || '').trim(),
          unitPrice: Number(String(row['Preço Compra'] || '0').replace(',', '.')),
          boxPrice: Number(String(row['Preço Caixa'] || '0').replace(',', '.')),
          boxQuantity: Number(String(row['Qtd/Caixa'] || '1').replace(',', '.')),
          unit: String(row['Unid.'] || 'un').trim(),
          distributorId: 15, // ID do JULINA FOODS que acabamos de criar
          imageUrl: null,
          isSpecialOffer: false
        };

        // Log para debug
        console.log('Processando produto:', {
          nome: product.name,
          codigo: product.itemCode,
          precoUnitario: product.unitPrice,
          precoCaixa: product.boxPrice,
          qtdCaixa: product.boxQuantity
        });

        // Enviar para a API
        const response = await fetch('http://localhost:5000/api/products', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(product)
        });

        if (!response.ok) {
          console.error(`Erro ao importar produto ${product.name}:`, await response.text());
        } else {
          console.log(`Produto importado com sucesso: ${product.name}`);
        }
      }

      console.log(`Processados ${Math.min((i + batchSize), products.length)} de ${products.length} produtos`);
    }

  } catch (error) {
    console.error('Erro durante a importação:', error);
  }
}

importProducts();