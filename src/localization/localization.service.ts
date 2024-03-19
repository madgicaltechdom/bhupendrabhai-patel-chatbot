import { Injectable } from '@nestjs/common';
import { localisedStrings as english } from '../i18n/en/localised-strings';
import { localisedStrings as hindi } from '../i18n/hn/localised-strings';
import { localisedStrings as gujarati } from '../i18n/gu/localised-strings';

@Injectable()
export class LocalizationService {
  static getLocalisedString = (language): any => {
    console.log(language);
    if (language == 'hindi') {
      return hindi;
    } 
    else if (language === 'english'){
      return english;
    }
    else if (language === 'gujarati'){
      return gujarati;
    }
  };
}
