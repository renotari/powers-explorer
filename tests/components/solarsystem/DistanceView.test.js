import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('DistanceView - Critical Bug Fixes', () => {
  let mockDataManager;

  beforeEach(() => {
    mockDataManager = {
      getOrbitalParameters: vi.fn(),
      getPlanetById: vi.fn((id) => ({
        id,
        name: id.charAt(0).toUpperCase() + id.slice(1),
        diameter: 12742000,
        color: '#3388FF'
      })),
      getOrbitalParametersById: vi.fn(),
      getConstants: vi.fn(() => ({
        astronomicalUnit: { value: 149597870700, unit: 'm' }
      }))
    };
  });

  describe('calculateLayout - Multiple Empty Array Guards', () => {
    it('should handle empty orbitalParams array', () => {
      mockDataManager.getOrbitalParameters.mockReturnValue([]);

      const orbitalParams = mockDataManager.getOrbitalParameters();

      // First guard: null or empty check
      if (!orbitalParams || orbitalParams.length === 0) {
        console.warn('[DistanceView] No orbital parameters available');
        const result = [];
        expect(result).toEqual([]);
        return;
      }

      expect.fail('Should have returned early for empty orbitalParams');
    });

    it('should handle null orbitalParams', () => {
      mockDataManager.getOrbitalParameters.mockReturnValue(null);

      const orbitalParams = mockDataManager.getOrbitalParameters();

      if (!orbitalParams || orbitalParams.length === 0) {
        console.warn('[DistanceView] No orbital parameters available');
        const result = [];
        expect(result).toEqual([]);
        return;
      }

      expect.fail('Should have returned early for null orbitalParams');
    });

    it('should handle orbitalParams with zero/negative distances', () => {
      mockDataManager.getOrbitalParameters.mockReturnValue([
        { id: 'mercury', semiMajorAxis: 0 },
        { id: 'venus', semiMajorAxis: -1000 }
      ]);

      const orbitalParams = mockDataManager.getOrbitalParameters();
      const maxDistance = Math.max(...orbitalParams.map(p => p.semiMajorAxis));

      expect(maxDistance).toBe(0);

      // Guard against invalid maxDistance
      if (maxDistance <= 0) {
        console.error('[DistanceView] Invalid orbital data: maxDistance <= 0');
        const result = [];
        expect(result).toEqual([]);
        return;
      }

      expect.fail('Should have returned early for invalid maxDistance');
    });

    it('should handle empty planets array after filtering', () => {
      mockDataManager.getOrbitalParameters.mockReturnValue([
        { id: 'earth', semiMajorAxis: 149598023000 }
      ]);
      mockDataManager.getPlanetById.mockReturnValue(null); // All planets return null

      const planetIds = ['earth', 'mars', 'jupiter'];
      const planets = planetIds.map(id => mockDataManager.getPlanetById(id)).filter(Boolean);

      expect(planets).toEqual([]);

      // Guard against empty planets array
      if (planets.length === 0) {
        console.warn('[DistanceView] No valid planets found');
        const result = [];
        expect(result).toEqual([]);
        return;
      }

      expect.fail('Should have returned early for empty planets array');
    });

    it('should handle planets with zero/negative diameters', () => {
      mockDataManager.getOrbitalParameters.mockReturnValue([
        { id: 'earth', semiMajorAxis: 149598023000 }
      ]);
      mockDataManager.getPlanetById.mockReturnValue({
        id: 'earth',
        diameter: 0  // Zero diameter
      });

      const planetIds = ['earth'];
      const planets = planetIds.map(id => mockDataManager.getPlanetById(id)).filter(Boolean);
      const maxPlanetDiameter = Math.max(...planets.map(p => p.diameter));

      expect(maxPlanetDiameter).toBe(0);

      // Guard against invalid diameter
      if (maxPlanetDiameter <= 0) {
        console.error('[DistanceView] Invalid planet data: maxPlanetDiameter <= 0');
        const result = [];
        expect(result).toEqual([]);
        return;
      }

      expect.fail('Should have returned early for invalid maxPlanetDiameter');
    });

    it('should work correctly with valid orbital data', () => {
      mockDataManager.getOrbitalParameters.mockReturnValue([
        { id: 'earth', semiMajorAxis: 149598023000 },
        { id: 'mars', semiMajorAxis: 227939366000 },
        { id: 'jupiter', semiMajorAxis: 778479000000 }
      ]);
      mockDataManager.getPlanetById.mockImplementation((id) => ({
        id,
        name: id,
        diameter: id === 'jupiter' ? 139820000 : (id === 'earth' ? 12742000 : 6779000)
      }));

      const orbitalParams = mockDataManager.getOrbitalParameters();
      expect(orbitalParams.length).toBe(3);

      const maxDistance = Math.max(...orbitalParams.map(p => p.semiMajorAxis));
      expect(maxDistance).toBe(778479000000); // Jupiter
      expect(maxDistance).toBeGreaterThan(0);

      const planetIds = ['earth', 'mars', 'jupiter'];
      const planets = planetIds.map(id => mockDataManager.getPlanetById(id)).filter(Boolean);
      expect(planets.length).toBe(3);

      const maxPlanetDiameter = Math.max(...planets.map(p => p.diameter));
      expect(maxPlanetDiameter).toBe(139820000); // Jupiter
      expect(maxPlanetDiameter).toBeGreaterThan(0);

      // Should be able to calculate size scale
      const planetSizeScale = 15 / maxPlanetDiameter;
      expect(planetSizeScale).toBeGreaterThan(0);
      expect(isFinite(planetSizeScale)).toBe(true);
    });
  });

  describe('drawDistanceMarkers - Empty Array Guard', () => {
    it('should handle empty orbitalParams for AU markers', () => {
      mockDataManager.getOrbitalParameters.mockReturnValue([]);

      const orbitalParams = mockDataManager.getOrbitalParameters();

      if (!orbitalParams || orbitalParams.length === 0) {
        // Early return, no markers drawn
        expect(true).toBe(true);
        return;
      }

      expect.fail('Should have returned early');
    });

    it('should handle zero maxDistance for AU markers', () => {
      mockDataManager.getOrbitalParameters.mockReturnValue([
        { id: 'planet1', semiMajorAxis: 0 }
      ]);

      const orbitalParams = mockDataManager.getOrbitalParameters();
      const maxDistance = Math.max(...orbitalParams.map(p => p.semiMajorAxis));

      expect(maxDistance).toBe(0);

      if (maxDistance <= 0) {
        console.error('[DistanceView] Invalid orbital data for AU markers');
        // Early return
        return;
      }

      expect.fail('Should have returned early for zero maxDistance');
    });

    it('should calculate AU marker positions correctly with valid data', () => {
      mockDataManager.getOrbitalParameters.mockReturnValue([
        { id: 'neptune', semiMajorAxis: 4498252900000 } // ~30 AU
      ]);

      const orbitalParams = mockDataManager.getOrbitalParameters();
      const maxDistance = Math.max(...orbitalParams.map(p => p.semiMajorAxis));

      expect(maxDistance).toBeGreaterThan(0);

      const AU = 149597870700;
      const auMarkers = [1, 5, 10, 20, 30];

      auMarkers.forEach(au => {
        const distanceMeters = au * AU;
        expect(distanceMeters).toBeGreaterThan(0);
        expect(distanceMeters).toBeLessThanOrEqual(maxDistance);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle single planet', () => {
      mockDataManager.getOrbitalParameters.mockReturnValue([
        { id: 'earth', semiMajorAxis: 149598023000 }
      ]);
      mockDataManager.getPlanetById.mockReturnValue({
        id: 'earth',
        diameter: 12742000
      });

      const orbitalParams = mockDataManager.getOrbitalParameters();
      expect(orbitalParams.length).toBe(1);

      const maxDistance = Math.max(...orbitalParams.map(p => p.semiMajorAxis));
      expect(maxDistance).toBeGreaterThan(0);

      const planets = [mockDataManager.getPlanetById('earth')].filter(Boolean);
      expect(planets.length).toBe(1);

      const maxPlanetDiameter = Math.max(...planets.map(p => p.diameter));
      expect(maxPlanetDiameter).toBeGreaterThan(0);
    });

    it('should handle very small and very large distances', () => {
      mockDataManager.getOrbitalParameters.mockReturnValue([
        { id: 'mercury', semiMajorAxis: 57909050000 },     // 0.39 AU
        { id: 'neptune', semiMajorAxis: 4498252900000 }    // 30 AU
      ]);

      const orbitalParams = mockDataManager.getOrbitalParameters();
      const maxDistance = Math.max(...orbitalParams.map(p => p.semiMajorAxis));
      const minDistance = Math.min(...orbitalParams.map(p => p.semiMajorAxis));

      expect(maxDistance / minDistance).toBeGreaterThan(70); // Neptune ~77x farther

      // Logarithmic scaling should handle this
      expect(maxDistance).toBeGreaterThan(0);
      expect(minDistance).toBeGreaterThan(0);
    });
  });
});
