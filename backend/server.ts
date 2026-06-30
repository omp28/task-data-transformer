import express, { Request, Response } from 'express';
import multer from 'multer';
import cors from 'cors';
import * as fs from 'fs';
import * as path from 'path';
import { Pipeline } from './services/pipeline';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({ storage });

app.post('/api/transform',
  upload.fields([
    { name: 'csv', maxCount: 1 },
    { name: 'resume', maxCount: 1 },
    { name: 'config', maxCount: 1 }
  ]),
  async (req: Request, res: Response) => {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      
      const csvFile = files?.csv?.[0];
      const resumeFile = files?.resume?.[0];
      const configFile = files?.config?.[0];

      const pipeline = new Pipeline();
      const result = await pipeline.run(
        csvFile?.path,
        resumeFile?.path,
        configFile?.path,
        {
          csv: csvFile?.originalname,
          resume: resumeFile?.originalname,
          config: configFile?.originalname
        }
      );

      if (csvFile) fs.unlinkSync(csvFile.path);
      if (resumeFile) fs.unlinkSync(resumeFile.path);
      if (configFile) fs.unlinkSync(configFile.path);

      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: `Server error: ${error}`,
        warnings: []
      });
    }
  }
);

app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.get('/api/configs/default', (req: Request, res: Response) => {
  const defaultConfig = {
    fields: [],
    includeConfidence: true,
    includeProvenance: true,
    onMissing: 'null'
  };
  res.json(defaultConfig);
});

app.get('/api/configs/custom', (req: Request, res: Response) => {
  const customConfig = {
    fields: [
      { path: 'full_name', from: 'fullName', type: 'string', required: true },
      { path: 'primary_email', from: 'emails[0]', type: 'string', required: true },
      { path: 'phone', from: 'phones[0]', type: 'string', normalize: 'E164' },
      { path: 'skills', from: 'skills[].name', type: 'string[]', normalize: 'canonical' },
      { path: 'years_experience', from: 'yearsExperience', type: 'number' },
      { path: 'current_company', from: 'experience[0].company', type: 'string' },
      { path: 'linkedin', from: 'links.linkedin', type: 'string' }
    ],
    includeConfidence: true,
    includeProvenance: false,
    onMissing: 'null'
  };
  res.json(customConfig);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});

export default app;
