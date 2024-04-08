import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { CustomException } from '../common/exception/custom.exception';
import { localisedStrings } from '../i18n/en/localised-strings';

@Injectable()
export abstract class MessageService {
  async prepareWelcomeMessage() {
    return localisedStrings.welcomeMessage;
  }
  getSeeMoreButtonLabel() {
    return localisedStrings.seeMoreMessage;
  }

  async sendMessage(baseUrl: string, requestData: any, token: string) {
    try {
      const response = await axios.post(baseUrl, requestData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      throw new CustomException(error);
    }
  }

  abstract sendWelcomeMessage(from: string, language: string);
  abstract sendLanguageChangedMessage(from: string, language: string);
  abstract askUserName(from: string, language: string);
  abstract askUserAdress(from: string, language: string);
  abstract sendMessageForCorrectAns(from: string, language: string);
  abstract sendMessageForIncorrectAns(from: string, language: string);
  abstract sendMessageForDailyLimit(from:string, language: string);
  abstract createButtons(from: string, language: string);
  abstract languageButtons(from: string,language:string);
  abstract askQuestionButton(from: string,language:string);
  abstract sendweaviateMessage(  from: string,question: string,language: string,chatHistory: any,answer: string,);
  abstract sendWaitMessage(from: string, language: string);
  abstract sendSureMessage(from: string, language: string);
}
