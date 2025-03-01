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

    // Processar em lotes menores
    const batchSize = 5;
    let totalImported = 0;
    let totalSkipped = 0;
    let totalErrors = 0;
    let lastProcessedIndex = 0;

    // Processar o primeiro lote
    await processNextBatch();

    async function processNextBatch() {
      if (lastProcessedIndex >= validProducts.length) {
        console.log('\nResumo final da importação:');
        console.log(`Total de produtos processados: ${validProducts.length}`);
        console.log(`Produtos importados com sucesso: ${totalImported}`);
        console.log(`Produtos ignorados (já existem): ${totalSkipped}`);
        console.log(`Produtos com erro: ${totalErrors}`);
        return;
      }

      const batch = validProducts.slice(lastProcessedIndex, lastProcessedIndex + batchSize);
      const currentBatch = Math.floor(lastProcessedIndex/batchSize) + 1;
      const totalBatches = Math.ceil(validProducts.length/batchSize);

      console.log(`\nProcessando lote ${currentBatch} de ${totalBatches}`);

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
        }
      } catch (error) {
        console.error(`\nErro ao processar lote ${currentBatch}:`, error);
        totalErrors += batch.length;
      }

      // Atualizar o índice e agendar o próximo lote
      lastProcessedIndex += batchSize;

      // Pequena pausa entre os lotes para não sobrecarregar
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Processar próximo lote
      await processNextBatch();
    }

  } catch (error) {
    console.error('\nErro crítico durante a importação:', error);
  }
}

importProducts();