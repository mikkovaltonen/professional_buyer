// Väliaikainen tiedostojen tallennustila session ajaksi
let sessionFiles: { [key: string]: File } = {};

export const fileService = {
  // Tallenna tiedosto session ajaksi
  storeFile: (file: File): string => {
    const fileId = Math.random().toString(36).substring(7);
    sessionFiles[fileId] = file;
    return fileId;
  },

  // Hae tiedosto ID:n perusteella
  getFile: (fileId: string): File | null => {
    return sessionFiles[fileId] || null;
  },

  // Poista tiedosto
  removeFile: (fileId: string): void => {
    delete sessionFiles[fileId];
  },

  // Tyhjennä kaikki tiedostot
  clearFiles: (): void => {
    sessionFiles = {};
  }
}; 