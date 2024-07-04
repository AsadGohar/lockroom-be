import { Injectable } from '@nestjs/common';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import { FilesService } from 'src/files/files.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UploadService {
  private readonly s3Client = new S3Client({
    region: this.configService.getOrThrow('AWS_S3_REGION'),
  });

  constructor(
    private readonly configService: ConfigService,
    private readonly fileService: FilesService,
  ) {}

  async uploadMultiple(
    files: Array<Express.Multer.File>,
    folder_id: string,
    user_id: string,
    organization_id: string,
  ) {
    if (files.length > 0) {
      const file_names = [];

      const file_promises = files.map((file) => {
        const file_name = uuidv4() + '-' + file.originalname;

        file_names.push(file_name);

        return this.s3Client.send(
          new PutObjectCommand({
            Bucket: 'lockroom',
            Key: file_name,
            Body: file.buffer,
            ContentType: file.mimetype,
          }),
        );
      });

      const response = await Promise.all(file_promises);
      if (response) {
        for (let index = 0; index < files.length; index++) {
          const file_name_parts = file_names[index].split('.');

          const file_extension =
            file_name_parts.length > 1 ? file_name_parts.pop() : '';

          await this.fileService.addFileToAFolder(
            files[index].originalname,
            folder_id,
            user_id,
            organization_id,
            files[index].mimetype || 'unknown',
            files[index].size || 1,
            file_extension,
            file_names[index],
          );
        }
      }

      return response;
    }
  }

  async uploadEcelFileToS3(file: Buffer, file_name: string) {
    const params = {
      Bucket: 'lockroom',
      Key: file_name,
      Body: file,
      ContentType:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };

    return await this.s3Client.send(new PutObjectCommand(params));
  }

  async dragAndDrop(files: Array<Express.Multer.File>, file_ids: string[]) {
    const file_data = [];

    for (let index = 0; index < files.length; index++) {
      const file_name = uuidv4() + '-' + files[index].originalname;
      const upload = await this.s3Client.send(
        new PutObjectCommand({
          Bucket: 'lockroom',
          Key: file_name,
          Body: files[index].buffer,
          ContentType: files[index].mimetype,
        }),
      );
      if (upload) {
        const updated_file =
          await this.fileService.updateFileNameAndBucketUrlDragAndDrop(
            file_ids[index],
            file_name,
          );
        file_data.push(updated_file);
      }
    }
    return file_data;
  }

  async uploadFileAndUpdateUrl(file: Express.Multer.File, file_id: string) {
    const new_file = file[0];
    const file_name = uuidv4() + '-' + new_file.originalname;
    const upload = await this.s3Client.send(
      new PutObjectCommand({
        Bucket: 'lockroom',
        Key: file_name,
        Body: new_file.buffer,
        ContentType: new_file.mimetype,
      }),
    );
    if (upload) {
      return await this.fileService.findFileAndUpdateUrl(file_id, file_name);
    } else {
      return { message: 'failed to upload file  ' };
    }
  }
}
