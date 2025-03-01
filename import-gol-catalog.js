import { readFileSync } from 'fs';
import fetch from 'node-fetch';

async function importGolCatalog() {
  try {
    console.log('Iniciando importação do catálogo Gol Supermarket...');

    // Ler o arquivo de texto
    const content = readFileSync('attached_assets/Pasted-Arroz-Arroz-Tio-Jo-o-20lbs-Arroz-Tio-Jo-o-10lbs-Arroz-Tio-Jo-o-1kg-Arroz-Camil-20lbs-Arroz-Camil-10l-1740854218642.txt', 'utf-8');

    // Lista de categorias conhecidas
    const knownCategories = [
      'Arroz',
      'Feijão',
      'Misturas e Polvilho',
      'Tapioca e Fubá',
      'Farinha e Flocão',
      'Açúcar e Sal',
      'Café e Achocolatado',
      'Leite e Derivados',
      'Refrigerantes e Bebidas',
      'Doces e Chocolates',
      'Biscoitos e Snacks',
      'Molhos e Conservas',
      'Temperos e Condimentos',
      'Produtos Diversos'
    ];

    // Separar as linhas e remover linhas vazias
    const lines = content.split('\n')
      .map(line => line.trim())
      .filter(line => line);

    let currentCategory = '';
    const products = [];

    // Processar cada linha
    lines.forEach((line) => {
      // Se a linha é uma categoria conhecida
      if (knownCategories.includes(line)) {
        currentCategory = line;
      } else if (currentCategory && line !== currentCategory) {
        // É um produto
        // Ignorar linhas que parecem ser subcategorias (começam com produtos gerais)
        if (!line.toLowerCase().includes('produtos') && !line.includes(':')) {
          products.push({
            name: line,
            itemCode: `GOL-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
            supplierCode: '',
            barCode: '',
            description: currentCategory,
            distributorId: 13, // ID do GOL SUPERMARKET (recém-criado)
            unitPrice: 0, // Preço inicial 0, para ser atualizado depois
            boxPrice: null,
            boxQuantity: 1,
            unit: 'un',
            imageUrl: null,
            isSpecialOffer: false
          });
        }
      }
    });

    console.log(`Total de produtos encontrados: ${products.length}`);
    console.log('\nExemplo de produtos por categoria:');
    const samplesByCategory = {};
    products.forEach(p => {
      if (!samplesByCategory[p.description]) {
        samplesByCategory[p.description] = [];
      }
      if (samplesByCategory[p.description].length < 2) {
        samplesByCategory[p.description].push(p.name);
      }
    });
    Object.entries(samplesByCategory).forEach(([category, samples]) => {
      console.log(`\n${category}:`);
      samples.forEach(sample => console.log(`- ${sample}`));
    });

    // Processar em lotes
    const batchSize = 5;
    let totalImported = 0;
    let totalSkipped = 0;
    let totalErrors = 0;

    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize);
      console.log(`\nProcessando lote ${Math.floor(i/batchSize) + 1} de ${Math.ceil(products.length/batchSize)}`);

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
          console.log(`Resultado do lote ${Math.floor(i/batchSize) + 1}:`, result);
          totalImported += result.productsImported || 0;
          totalSkipped += result.productsSkipped || 0;
        }
      } catch (error) {
        console.error(`\nErro ao processar lote ${Math.floor(i/batchSize) + 1}:`, error);
        totalErrors += batch.length;
      }

      // Pequena pausa entre os lotes
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('\nResumo da importação:');
    console.log(`Total de produtos no arquivo: ${products.length}`);
    console.log(`Produtos importados com sucesso: ${totalImported}`);
    console.log(`Produtos ignorados (já existem): ${totalSkipped}`);
    console.log(`Produtos com erro: ${totalErrors}`);

  } catch (error) {
    console.error('\nErro crítico durante a importação:', error);
  }
}

importGolCatalog();