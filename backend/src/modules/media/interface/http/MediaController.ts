import type { Request, Response } from 'express';
import { uploadedFileFrom } from '../../../../shared/infrastructure/http/upload.js';
import type { UploadImage } from '../../application/UploadImage.js';

export class MediaController {
  constructor(private readonly uploadImage: UploadImage) {}

  uploadImageFile = async (req: Request, res: Response): Promise<void> => {
    const location = await this.uploadImage.execute(uploadedFileFrom(req, true));
    res.status(201).json(location);
  };
}
