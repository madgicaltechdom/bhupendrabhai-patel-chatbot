import { Injectable } from '@nestjs/common';
import * as dotenv from 'dotenv';
import { LocalizationService } from '../localization/localization.service';
import { MessageService } from '../message/message.service';
import { localisedStrings as english } from '../i18n/en/localised-strings';
import { localisedStrings as hindi } from '../i18n/hn/localised-strings';
import { localisedStrings as gujarati } from '../i18n/gu/localised-strings';
import axios from 'axios';

dotenv.config();

@Injectable()
export class SwiftchatMessageService extends MessageService {
  private botId = process.env.BOT_ID;
  private apiKey = process.env.API_KEY;
  private apiUrl = process.env.API_URL;
  private baseUrl = `${this.apiUrl}/${this.botId}/messages`;

  private prepareRequestData(from: string, requestBody: string): any {
    return {
      to: from,
      type: 'text',
      text: {
        body: requestBody,
      },
    };
  }
  async sendWelcomeMessage(from: string, language: string) {
    const localisedStrings = LocalizationService.getLocalisedString(language);
    const requestData = this.prepareRequestData(
      from,
      localisedStrings.welcomeMessage,
    );

    const response = await this.sendMessage(
      this.baseUrl,
      requestData,
      this.apiKey,
    );
    return response;
  }

  async sendMessageForCorrectAns(from: string, language: string) {
    const localisedStrings = LocalizationService.getLocalisedString(language);
    const requestData = this.prepareRequestData(
      from,
      localisedStrings.demo_asnwer,
    );

    const response = await this.sendMessage(
      this.baseUrl,
      requestData,
      this.apiKey,
    );
    return response;
  }

  async sendMessageForIncorrectAns(from: string, language: string) {
    const localisedStrings = LocalizationService.getLocalisedString(language);
    const requestData = this.prepareRequestData(
      from,
      localisedStrings.no_answer_message,
    );

    const response = await this.sendMessage(
      this.baseUrl,
      requestData,
      this.apiKey,
    );
    return response;
  }

  async sendMessageForDailyLimit(from: string, language: string) {
    console.log("This function has been called: ")
    const localisedStrings = LocalizationService.getLocalisedString(language);
    const requestData = this.prepareRequestData(
      from,
      localisedStrings.daily_limit,
    );

    const response = await this.sendMessage(
      this.baseUrl,
      requestData,
      this.apiKey,
    );
    return response;
  }

  async sendLanguageChangedMessage(from: string, language: string) {
    const localisedStrings = LocalizationService.getLocalisedString(language);
    const requestData = this.prepareRequestData(
      from,
      localisedStrings.select_language,
    );

    const response = await this.sendMessage(
      this.baseUrl,
      requestData,
      this.apiKey,
    );
    return response;
  }

  async askUserName(from: string, language: string) {
    const localisedStrings = LocalizationService.getLocalisedString(language);
    const requestData = this.prepareRequestData(
      from,
      localisedStrings.ask_user_name,
    );

    const response = await this.sendMessage(
      this.baseUrl,
      requestData,
      this.apiKey,
    );
    return response;
  }

  async askUserAdress(from: string, language: string) {
    const localisedStrings = LocalizationService.getLocalisedString(language);
    const requestData = this.prepareRequestData(
      from,
      localisedStrings.ask_user_address,
    );

    const response = await this.sendMessage(
      this.baseUrl,
      requestData,
      this.apiKey,
    );
    return response;
  }

  async createButtons(from: string, language: string): Promise<void> {
    let localisedStrings;
    switch (language) {
      case 'english':
        localisedStrings = english;
        break;
      case 'hindi':
        localisedStrings = hindi;
        break;
      case 'gujarati':
        localisedStrings = gujarati;
        break;
      default:
        // Default to English if language is not recognized
        localisedStrings = english;
        break;
    }
    console.log(localisedStrings);
    const url = `${this.apiUrl}/${this.botId}/messages`;
    const messageData = {
      to: from,
      type: 'button',
      button: {
        body: {
          type: 'text',
          text: {
            body: localisedStrings.createButtonBody,
          },
        },
        buttons: localisedStrings.district_buttons,
        allow_custom_response: false,
      },
    };
    try {
      const response = await axios.post(url, messageData, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Some Internal errors:', error);
    }
  }

  async languageButtons(from: string, language: string): Promise<void> {
    let localisedStrings;
    switch (language) {
      case 'english':
        localisedStrings = english;
        break;
      case 'hindi':
        localisedStrings = hindi;
        break;
      case 'gujarati':
        localisedStrings = gujarati;
        break;
      default:
        // Default to English if language is not recognized
        localisedStrings = english;
        break;
    }

    const url = `${this.apiUrl}/${this.botId}/messages`;
    const messageData = {
      to: from,
      type: 'button',
      button: {
        body: {
          type: 'text',
          text: {
            body: localisedStrings.languageBody,
          },
        },
        buttons: [
          {
            type: 'solid',
            body: 'Hindi',
            reply: 'hindi',
          },
          {
            type: 'solid',
            body: 'English',
            reply: 'english',
          },
          {
            type: 'solid',
            body: 'Gujarati',
            reply: 'gujarati',
          },
        ],
        allow_custom_response: false,
      },
    };
    try {
      const response = await axios.post(url, messageData, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      console.error('errors:', error);
    }
  }

  async askQuestionButton(from: string,language:string): Promise<any> {
    let localisedStrings;
    switch (language) {
      case 'english':
        localisedStrings = english;
        break;
      case 'hindi':
        localisedStrings = hindi;
        break;
      case 'gujarati':
        localisedStrings = gujarati;
        break;
      default:
        // Default to English if language is not recognized
        localisedStrings = english;
        break;
    }
    const url = `${this.apiUrl}/${this.botId}/messages`;
    const messageData = {
      to: from,
      type: 'button',
      button: {
        body: {
          type: 'text',
          text: {
            body: localisedStrings.askQuestionBody,
          },
        },
        buttons: [
          {
            type: 'solid',
            body: localisedStrings.askQuestionButtonReply,
            reply: localisedStrings.askQuestionButtonReply,
          },
        ],
        allow_custom_response: false,
      },
    };
    try {
      const response = await axios.post(url, messageData, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      console.error('errors:', error);
    }
  }
}
