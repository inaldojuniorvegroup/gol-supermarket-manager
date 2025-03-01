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

export async function searchProductImage(productName: string, startIndex: number = 1): Promise<{items: string[], totalResults: number}> {
  try {
    // Limpar o nome do produto removendo apenas aspas e apóstrofos
    const cleanedName = productName
      .replace(/['"`]/g, '') // Remove apóstrofos e aspas
      .trim();

    console.log('Buscando imagens para:', cleanedName);

    const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
      params: {
        key: process.env.GOOGLE_API_KEY,
        cx: process.env.GOOGLE_SEARCH_ENGINE_ID,
        q: `produtos ${cleanedName}`,    // Adicionar "produtos" para ajudar na busca
        searchType: 'image',
        num: 10,                         // Número de resultados por página
        start: startIndex                // Índice inicial para paginação
      }
    });

    return {
      items: response.data.items?.map((item: any) => item.link) || [],
      totalResults: Number(response.data.searchInformation?.totalResults) || 0
    };
  } catch (error) {
    console.error('Error searching for product images:', error);
    return { items: [], totalResults: 0 };
  }
}