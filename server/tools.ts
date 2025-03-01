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
      .replace(/\b(un|cx|ea|g|kg|ml|l)\b/gi, '') // Remove unidades de medida
      .replace(/\s+/g, ' ')                     // Remove espaços extras
      .trim();                                  // Remove espaços nas bordas

    // Extrai a gramatura do nome (números seguidos por g, kg, ml, l)
    const gramaturaMatch = productName.match(/(\d+\s*(g|kg|ml|l))/i);
    const gramatura = gramaturaMatch ? gramaturaMatch[0] : '';

    // Constrói a query de busca com o nome limpo e a gramatura
    const searchQuery = `${cleanedName} ${gramatura}`.trim();
    console.log('Buscando imagens para:', searchQuery);

    const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
      params: {
        key: process.env.GOOGLE_API_KEY,
        cx: process.env.GOOGLE_SEARCH_ENGINE_ID,
        q: searchQuery,
        searchType: 'image',
        num: 6,  // Buscar 6 imagens
        imgType: 'photo',
        imgSize: 'large', // Preferir imagens grandes
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