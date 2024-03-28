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
          const file_extension =
            file_name_parts.length > 1 ? file_name_parts.pop() : '';

          await this.fileService.addFileToAFolder(
            files[index].originalname,
            folder_id,
            user_id,
            organization_id,
            files[index].mimetype || 'x',
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

  async dragAndDrop(files: any[], file_ids: string[]) {
    const  file_data = []
    for (let index = 0; index < files.length; index++) {
      let file_name = uuidv4() + '-' + files[index].originalname;
     let upload =  await this.s3Client.send(
        new PutObjectCommand({
          Bucket: 'lockroom',
          Key: file_name,
          Body: files[index].buffer,
        }),
      );
      if(upload){
       const updated_file= await this.fileService.updateFileNameAndBucketUrlDragAndDrop(
          file_ids[index],
          file_name,
        );
        file_data.push(updated_file)
      }
    }
    return file_data
  }
}
