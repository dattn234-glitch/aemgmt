import { Controller, Get, Inject } from "@nestjs/common";
import { ContentService } from "./content.service.js";

@Controller("site")
export class ContentController {
  constructor(@Inject(ContentService) private readonly contentService: ContentService) {}

  @Get()
  getSiteContent() {
    return this.contentService.getSiteContent();
  }
}
