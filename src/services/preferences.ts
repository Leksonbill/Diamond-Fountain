export interface UserPreference {
  genreRanking: Record<string, number>;
  moodHistory: string[];
  lastUsedAt: number;
}

const STORAGE_KEY = 'script_sage_prefs';

export const preferenceService = {
  getPreferences(): UserPreference {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    return {
      genreRanking: {},
      moodHistory: [],
      lastUsedAt: Date.now(),
    };
  },

  updatePreference(genre: string, mood: string) {
    const prefs = this.getPreferences();
    
    // Update genre ranking
    prefs.genreRanking[genre] = (prefs.genreRanking[genre] || 0) + 1;
    
    // Update mood history
    prefs.moodHistory.push(mood);
    if (prefs.moodHistory.length > 10) {
      prefs.moodHistory.shift();
    }
    
    prefs.lastUsedAt = Date.now();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  },

  getTopGenres(): string[] {
    const prefs = this.getPreferences();
    return Object.entries(prefs.genreRanking)
      .sort((a, b) => b[1] - a[1])
      .map(([genre]) => genre)
      .slice(0, 3);
  }
};
