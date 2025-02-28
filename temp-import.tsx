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

    // Mapear os produtos para o formato esperado pela API
    const mappedProducts = products.map((row: any) => ({
      name: String(row['Nome'] || '').trim(),
      itemCode: String(row['Código'] || '').trim(),
      supplierCode: String(row['Cód.Forn.'] || '').trim(),
      barCode: String(row['Cód.Barra'] || '').trim(),
      description: String(row['Departamento'] || '').trim(),
      unitPrice: Number(String(row['Preço Compra'] || '0').replace(',', '.')),
      boxPrice: Number(String(row['Preço Caixa'] || '0').replace(',', '.')),
      boxQuantity: Number(String(row['Qtd/Caixa'] || '1').replace(',', '.')),
      unit: String(row['Unid.'] || 'un').trim(),
      distributorId: 15, // ID do JULINA FOODS que acabamos de criar
      imageUrl: null,
      isSpecialOffer: false
    }));

    // Remover produtos sem nome ou código
    const validProducts = mappedProducts.filter(p => p.name && p.itemCode);
    console.log(`Produtos válidos encontrados: ${validProducts.length}`);

    // Processar em lotes
    const batchSize = 50;
    let totalImported = 0;
    let totalErrors = 0;

    for (let i = 0; i < validProducts.length; i += batchSize) {
      const batch = validProducts.slice(i, i + batchSize);
      console.log(`Processando lote ${Math.floor(i/batchSize) + 1} de ${Math.ceil(validProducts.length/batchSize)}`);

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
        } else {
          const result = await response.json();
          console.log(`Lote ${Math.floor(i/batchSize) + 1} importado:`, result);
          totalImported += result.productsImported || 0;
        }
      } catch (error) {
        console.error(`Erro ao processar lote ${Math.floor(i/batchSize) + 1}:`, error);
        totalErrors += batch.length;
      }

      // Pequena pausa entre os lotes para não sobrecarregar o servidor
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('\nResumo da importação:');
    console.log(`Total de produtos: ${validProducts.length}`);
    console.log(`Produtos importados com sucesso: ${totalImported}`);
    console.log(`Produtos com erro: ${totalErrors}`);

  } catch (error) {
    console.error('Erro durante a importação:', error);
  }
}

importProducts();