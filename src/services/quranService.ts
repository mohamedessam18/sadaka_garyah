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
  }
};
