import { LocalStorageService } from "./storage";
import { BaseEntity } from "./types";

export enum FileType {
    Pdf,
}

export interface Document extends BaseEntity {
    fileType: FileType;
    bytes: string;
}

export interface Answer extends BaseEntity {

}


export class Answer {
    ANSWER_STORAGE_KEY = 'storage/src/lib/answer.ts:main';
    ANSWER_VERSION_KEY = '1.0';

    private localStorage = new LocalStorageService<Answer>(this.ANSWER_STORAGE_KEY, this.ANSWER_VERSION_KEY);
    uploadAnswerDocument(doc: Document) {

    }
}