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
    // Remover apenas unidades de medida, manter números para gramatura
    const cleanedName = productName
      .replace(/\b(un|cx|ea)\b/gi, '') // Remove apenas unidades que não são medidas
      .replace(/\s+/g, ' ')           // Remove espaços extras
      .trim();                        // Remove espaços nas bordas

    console.log('Buscando imagens para:', cleanedName);

    const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
      params: {
        key: process.env.GOOGLE_API_KEY,
        cx: process.env.GOOGLE_SEARCH_ENGINE_ID,
        q: `${cleanedName} produto`,
        searchType: 'image',
        num: 6,           // Buscar 6 imagens
        imgType: 'photo', // Apenas fotos
        safe: 'active'    // Filtro de conteúdo seguro
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