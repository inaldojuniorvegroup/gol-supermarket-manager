import { db } from "./db";
import axios from 'axios';

export async function execute_sql_tool(sql_query: string): Promise<any> {
  try {
    const result = await db.execute(sql_query);
    return result;
  } catch (error) {
    console.error('Error executing SQL:', error);
    throw error;
  }
}

export async function searchProductImage(productName: string): Promise<string[]> {
  try {
    // Limpar o nome do produto
    const cleanedName = productName
      .replace(/['"`]/g, '') // Remove apóstrofos e aspas
      .replace(/\b(un|cx|ea)\b/gi, '') // Remove unidades
      .replace(/\s+/g, ' ') // Remove espaços extras
      .trim();

    // Separar marca e nome do produto
    const parts = cleanedName.split(' ');
    const brand = parts[0]; // Primeira palavra (geralmente a marca)
    const nameWithoutBrand = parts.slice(1).join(' ');

    console.log('Buscando imagens para:', {
      original: productName,
      cleaned: cleanedName,
      brand,
      nameWithoutBrand
    });

    // Tentar diferentes combinações de busca
    const searchQueries = [
      `${cleanedName}`, // Nome completo limpo
      `${brand} ${nameWithoutBrand}`, // Marca + nome
      `${nameWithoutBrand} ${brand}`, // Nome + marca
      `${nameWithoutBrand}` // Apenas o nome sem a marca
    ];

    let allImages: string[] = [];

    // Fazer busca para cada variação
    for (const query of searchQueries) {
      if (allImages.length >= 6) break; // Se já temos imagens suficientes, para

      const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
        params: {
          key: process.env.GOOGLE_API_KEY,
          cx: process.env.GOOGLE_SEARCH_ENGINE_ID,
          q: `${query} produto alimento`,
          searchType: 'image',
          num: 6,
          imgType: 'photo',
          safe: 'active'
        }
      });

      if (response.data.items && response.data.items.length > 0) {
        const newImages = response.data.items
          .map((item: any) => item.link)
          .filter((url: string) => !allImages.includes(url));

        allImages = [...allImages, ...newImages];
      }
    }

    // Retornar no máximo 6 imagens únicas
    return allImages.slice(0, 6);
  } catch (error) {
    console.error('Error searching for product images:', error);
    return [];
  }
}