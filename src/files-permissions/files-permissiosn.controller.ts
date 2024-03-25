import {
  Controller,
} from '@nestjs/common';
import { FilesPermissionsService } from './file-permissions.service';


@Controller('files-permissions')
export class FilesPermissionsController {
  constructor(private readonly filesPermisions: FilesPermissionsService) {}
}
