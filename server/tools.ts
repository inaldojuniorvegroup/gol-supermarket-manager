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
    const cleanedName = productName
      .replace(/\b(kg|g|ml|l|un|cx)\b/gi, '') // Remove unidades de medida
      .replace(/\d+/g, '')                     // Remove números
      .trim();                                 // Remove espaços extras

    const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
      params: {
        key: process.env.GOOGLE_API_KEY,
        cx: process.env.GOOGLE_SEARCH_ENGINE_ID,
        q: `${cleanedName} produto embalagem`,
        searchType: 'image',
        num: 6,  // Buscar 6 imagens
        imgType: 'photo',
        safe: 'active'
      }
    });

    if (response.data.items && response.data.items.length > 0) {
      // Retornar array com todas as URLs de imagem encontradas
      return response.data.items.map((item: any) => item.link);
    }

    return [];
  } catch (error) {
    console.error('Error searching for product images:', error);
    return [];
  }
}