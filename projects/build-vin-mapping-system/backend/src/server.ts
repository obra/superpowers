import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = Number(process.env.PORT ?? 3001);

const mockVehicles: Record<string, any> = {
  JTDBR32E720123456: {
    vin: 'JTDBR32E720123456',
    makeId: 67,
    make: 'TOYOTA',
    modelId: 559,
    model: 'YARIS',
    year: 2024,
    status: 'MAPPED',
    eskaMakeId: 708,
    eskaMake: 'TOYOTA',
    eskaModelId: 54512,
    eskaModel: 'YARIS'
  },
  WBA00000000000001: {
    vin: 'WBA00000000000001',
    makeId: 88,
    make: 'BMW',
    modelId: 991,
    model: 'X5',
    year: 2023,
    status: 'UNMAPPED'
  }
};

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'vin-mapping-backend' });
});

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body ?? {};
  if (!username || !password) return res.status(400).json({ message: 'Username and password are required' });
  return res.json({ token: 'mock-token', user: { username, role: 'ADMIN' } });
});

app.get('/api/auth/me', (_req, res) => {
  res.json({ username: 'admin', role: 'ADMIN' });
});

app.get('/api/dashboard/summary', (_req, res) => {
  res.json({
    totalMakes: 126,
    totalModels: 1842,
    activeMappings: 1706,
    inactiveMappings: 18,
    unmappedCount: 118,
    coveragePercent: 92.6
  });
});

app.get('/api/vehicle/verify/:vin', (req, res) => {
  const vin = String(req.params.vin || '').trim().toUpperCase();
  if (vin.length !== 17) return res.status(400).json({ message: 'VIN must contain 17 characters' });

  const known = mockVehicles[vin];
  if (known) return res.json(known);

  return res.json({
    vin,
    makeId: 67,
    make: 'TOYOTA',
    modelId: 559,
    model: 'YARIS',
    year: 2024,
    status: 'UNMAPPED'
  });
});

app.get('/api/vin-master', (_req, res) => {
  res.json({
    items: [
      { vinMakeId: 67, make: 'TOYOTA', vinModelId: 559, model: 'YARIS', eskaMakeId: 708, eskaMake: 'TOYOTA', eskaModelId: 54512, eskaModel: 'YARIS', status: 'MAPPED' },
      { vinMakeId: 67, make: 'TOYOTA', vinModelId: 562, model: 'AVALON', eskaMakeId: 708, eskaMake: 'TOYOTA', eskaModelId: 45208, eskaModel: 'AVALON', status: 'MAPPED' },
      { vinMakeId: 67, make: 'TOYOTA', vinModelId: 1002, model: 'AVANZA', eskaMakeId: null, eskaMake: null, eskaModelId: null, eskaModel: null, status: 'UNMAPPED' }
    ],
    total: 3
  });
});

app.listen(PORT, () => {
  console.log(`VIN Mapping API running on http://localhost:${PORT}`);
});
