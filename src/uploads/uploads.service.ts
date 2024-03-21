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
    files: any[],
    folder_id: string,
    user_id: string,
    organization_id: string,
  ) {
    console.log(files[0]);

    console.log(folder_id, user_id, organization_id);
    if (files.length > 0) {
      const file_names = [];
      const file_promises = files.map((file: any) => {
        let file_name = uuidv4() + '-' + file.originalname;
        file_names.push(file_name);
        return this.s3Client.send(
          new PutObjectCommand({
            Bucket: 'lockroom',
            Key: file_name,
            Body: file.buffer,
          }),
          );
      });

      const response = await Promise.all(file_promises);
      if (true) {
        for (let index = 0; index < files.length; index++) {
          const file_name_parts = file_names[index].split('.');
          const file_extension =
            file_name_parts.length > 1 ? file_name_parts.pop() : '';
          // console.log(file_extension,'d')
          await this.fileService.addFileToAFolder(
            files[index].originalname,
            folder_id,
            user_id,
            organization_id,
            files[index].mimetype || '',
            files[index].size || 0,
            file_extension,
            file_names[index],
          );
        }
      }
      // console.log(response, 'uploads');
      return response;
    }
  }

  async uploadFileToS3(file: Buffer, file_name: string) {
    const params = {
      Bucket: 'lockroom',
      Key: file_name,
      Body: file,
      ContentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };

    const upload = await this.s3Client.send(new PutObjectCommand(params))
    
   
  }
}
