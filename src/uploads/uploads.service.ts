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
        if (response) {
          for (let index = 0; index < files.length; index++) {
            const file_name_parts = file_names[index].split('.');
            const file_extension = file_name_parts.length > 1 ? file_name_parts.pop() : '';
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
        console.log(response, 'uploads');
        return response;
      }
  }
}
