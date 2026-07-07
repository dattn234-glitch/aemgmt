import { Injectable } from "@nestjs/common";
import { siteContent } from "./site-content.js";

@Injectable()
export class ContentService {
  getSiteContent() {
    return siteContent;
  }
}
