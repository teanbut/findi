import { IsOptional, IsString, Matches } from 'class-validator';

export class CreateMailAccountDto {
  // Local part only — the address is always @findi.co.za, never a domain
  // the caller controls.
  @IsString()
  @Matches(/^[a-z0-9._-]+$/, {
    message: 'localPart must be lowercase letters, numbers, dots, underscores or hyphens',
  })
  localPart!: string;

  @IsOptional()
  @IsString()
  displayName?: string;
}
