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

  // async upload(
  //   file_name: string,
  //   file: Buffer,
  //   folder_id: string,
  //   user_id: string,
  //   organization_id: string,
  // ) {
  //   const file_upload = await this.s3Client.send(
  //     new PutObjectCommand({
  //       Bucket: 'lockroom',
  //       Key: file_name,
  //       Body: file,
  //     }),
  //   );
  //   if (file_upload) {
  //     const new_file = await this.fileService.addFileToAFolder(
  //       file_name,
  //       folder_id,
  //       user_id,
  //       organization_id,
  //       file.mime_type
  //     );
  //   }
  // }

  async uploadMultiple(
    files: any[],
    folder_id: string,
    user_id: string,
    organization_id: string,
  ) {
    if (files.length > 0) {
      console.log(files[0])
      const file_promises = files.map((file: any) => {
        return this.s3Client.send(
          new PutObjectCommand({
            Bucket: 'lockroom',
            Key: file.originalname + uuidv4(),
            Body: file.buffer,
          }),
        );
      });

      const response = await Promise.all(file_promises);
      if (response) {
        files.map(async (file) => {
          return await this.fileService.addFileToAFolder(
            file.originalname + uuidv4(),
            folder_id,
            user_id,
            organization_id,
            file.mimetype
          );
        });
        // const response_db = await Promise.all(file_records)
        // console.log(response_db)
      }
      console.log(response, 'uploads');
    }
  }
}
