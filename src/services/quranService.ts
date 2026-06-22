import { api } from './api';

export interface Surah {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: 'Meccan' | 'Medinan';
}

export interface Ayah {
  number: number;
  numberInSurah?: number;
  text: string;
  surah: {
    number: number;
    name: string;
    englishName: string;
  };
  juz: number;
  page: number;
}

export interface SurahEditionResponse {
  code: number;
  status: string;
  data: Array<{
    number: number;
    name: string;
    englishName: string;
    englishNameTranslation: string;
    revelationType: string;
    numberOfAyahs: number;
    ayahs: Array<{
      number: number;
      text: string;
      numberInSurah: number;
      juz: number;
      manzil: number;
      page: number;
      ruku: number;
      hizbQuarter: number;
      sajda: boolean | any;
    }>;
  }>;
}

export interface SurahAudioResponse {
  code: number;
  status: string;
  data: {
    number: number;
    ayahs: Array<{
      number: number;
      audio: string;
      audioSecondary: string[];
      text: string;
      numberInSurah: number;
    }>;
  };
}

export const quranService = {
  async getSurahs(): Promise<Surah[]> {
    const response = await api.get<{ code: number; status: string; data: Surah[] }>('https://api.alquran.cloud/v1/surah');
    return response.data;
  },

  async getSurahDetail(id: number, translationEdition: string): Promise<SurahEditionResponse['data']> {
    const response = await api.get<SurahEditionResponse>(
      `https://api.alquran.cloud/v1/surah/${id}/editions/quran-simple,${translationEdition}`
    );
    return response.data;
  },

  async getSurahAudio(id: number): Promise<SurahAudioResponse['data']> {
    const response = await api.get<SurahAudioResponse>(
      `https://api.alquran.cloud/v1/surah/${id}/ar.alafasy`
    );
    return response.data;
  },

  async getAyahDetails(number: number): Promise<any> {
    return api.get<any>(`https://api.alquran.cloud/v1/ayah/${number}`);
  },

  async getAyahAudio(number: number, reciterId: string): Promise<string> {
    const response = await api.get<any>(`https://api.alquran.cloud/v1/ayah/${number}/${reciterId}`);
    return response.data.audio;
  },

  async getAyahTranslation(number: number, edition: string): Promise<string> {
    const response = await api.get<any>(`https://api.alquran.cloud/v1/ayah/${number}/${edition}`);
    return response.data.text;
  },

  async getAyahTafsir(number: number, edition: string = 'ar.muyassar'): Promise<string> {
    const response = await api.get<any>(`https://api.alquran.cloud/v1/ayah/${number}/${edition}`);
    return response.data.text;
  },

  async getPageText(pageNo: number): Promise<any> {
    const response = await api.get<any>(`https://api.alquran.cloud/v1/page/${pageNo}/quran-simple`);
    return response.data;
  },

  async getPageTranslation(pageNo: number, edition: string): Promise<any> {
    const response = await api.get<any>(`https://api.alquran.cloud/v1/page/${pageNo}/${edition}`);
    return response.data;
  },

  async getPageAudio(pageNo: number): Promise<any> {
    const response = await api.get<any>(`https://api.alquran.cloud/v1/page/${pageNo}/ar.alafasy`);
    return response.data;
  },

  /**
   * Fetch Tajweed-HTML encoded text from quran.com API v4.
   * Returns a map: { [verseKey: string]: string } where value is raw HTML like
   * "نص <tajweed class="ghunnah">مّ</tajweed> عادي <span class=end>١</span>"
   */
  async getPageTajweed(pageNo: number): Promise<Record<string, string>> {
    // quran.com v4 paginates by page directly
    const url = `https://api.quran.com/api/v4/quran/verses/uthmani_tajweed?page_number=${pageNo}&per_page=50`;
    const response = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(`Tajweed API error: ${response.status}`);
    const json = await response.json();
    const map: Record<string, string> = {};
    for (const verse of (json.verses || [])) {
      let rawText = verse.text_uthmani_tajweed || '';
      
      // 1. Replace KFGQPC custom glyph mapping with standard Unicode equivalents
      rawText = rawText.replace(/\u0672/g, '\u0670'); // Alef with wavy hamza -> standard superscript alif
      rawText = rawText.replace(/\u0673/g, '\u0656'); // Alef with wavy hamza below -> standard subscript alif

      // 2. Fix dotted circle rendering issue in browsers:
      // If a <tajweed> tag starts with one or more combining marks (e.g., Fatha, Kasra, superscript alif, small high waw/ya),
      // the browser will render an isolated dotted circle because it cannot attach the mark to a base letter inside the tag.
      // Moving these combining marks to be immediately before the <tajweed> tag resolves the issue.
      const tajweedRegex = /(<tajweed\s+class=[^>]+>)([\p{M}\u06e5\u06e6]+)([\s\S]*?)(<\/tajweed>)/gu;
      rawText = rawText.replace(tajweedRegex, (_match: string, p1: string, p2: string, p3: string, p4: string) => p2 + p1 + p3 + p4);

      map[verse.verse_key] = rawText;
    }
    return map;
  }
};
