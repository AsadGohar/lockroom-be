import { AuditDto } from "./audit.dto"
import { PartialType } from "@nestjs/mapped-types"

export class PartialDto extends PartialType(AuditDto) { }
