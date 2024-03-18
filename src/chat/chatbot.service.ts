import { Injectable } from '@nestjs/common';
import IntentClassifier from '../intent/intent.classifier';
import { MessageService } from 'src/message/message.service';
import { UserService } from 'src/model/user.service';
import { localisedStrings as english } from 'src/i18n/en/localised-strings';
import { localisedStrings as hindi } from 'src/i18n/hn/localised-strings';
import { localisedStrings as gujarati } from 'src/i18n/gu/localised-strings';

import * as dotenv from 'dotenv';
dotenv.config();
import axios from 'axios';

@Injectable()
export class ChatbotService {
  private readonly intentClassifier: IntentClassifier;
  private readonly message: MessageService;
  private readonly userService: UserService;
  private readonly apiUrl = process.env.API_URL;
  private readonly botId = process.env.BOT_ID;
  private readonly apiKey = process.env.API_KEY;

  constructor(
    intentClassifier: IntentClassifier,
    message: MessageService,
    userService: UserService,
  ) {
    this.intentClassifier = intentClassifier;
    this.message = message;
    this.userService = userService;
  }



  public async processMessage(body: any): Promise<any> {
    const { from, text,button_response, persistent_menu_response } = body;
    console.log('button response is: ',button_response);

    const userData = await this.userService.findUserByMobileNumber(from,this.botId);
    
    if (!(button_response) && !(persistent_menu_response) && body.text.body === 'hi'){
      console.log("Yes")
      console.log(userData)
      await this.message.askUserName(from,userData.language)
      await this.userService.updateUserContext(from,this.botId,'greeting');
    }


    else if (persistent_menu_response){
      console.log('persistent menu is: ',persistent_menu_response);
      await this.languageButtons(from);
      await this.userService.updateButtonResponse(from,this.botId,persistent_menu_response.body);
      await this.userService.updateUserContext(from,this.botId,'persistent menu')
    }

    else if (button_response && userData.user_context === 'persistent menu' && userData.button_response === 'Change Language'){
      console.log("1");
      await this.userService.setUserPreferredLanguage(from,button_response.body,this.botId);
      await this.askQuestionButton(from);
      await this.userService.updateButtonResponse(from,this.botId,'ask new qtn');
    }
    else if (button_response && userData.user_context === 'persistent menu' && userData.button_response === 'ask new qtn'){
      await this.userService.updateUserContext(from,this.botId,button_response.body);
      console.log("true");
    }

    else if (userData.user_context === 'Ask a new question' && !(button_response)){
      console.log("Asking question")

      if (userData.question_limit <=10){
        console.log(text.body);
        if (text.body.toLowerCase() === english.demo_question.toLowerCase()){
          await this.message.sendMessageForCorrectAns(from,userData.language);
          await this.askQuestionButton(from);
        }
        else{
          await this.message.sendMessageForIncorrectAns(from,userData.language);
          await this.askQuestionButton(from);
        }
      }
      else{
        await this.message.sendMessageForDailyLimit(from,userData.language);
      }
    }
    else if (userData.user_context === 'greeting' && !(button_response) && !(persistent_menu_response)){
      await this.createButtons(from, userData.language);
      await this.userService.updateUserName(from,this.botId,body.text.body)
    }

    else if (button_response && (english.district_list.includes(button_response.body)) &&(body.text === null || body.text === undefined)){
      await this.message.askUserAdress(from,userData.language);
      await this.userService.updateUserContext(from,this.botId,'address');
    }

    else if ((userData.user_context === 'address')){
      await this.languageButtons(from);
      await this.userService.updateUserAddress(from,this.botId,body.text.body)
      await this.userService.updateUserContext(from,this.botId,null);
    }

    else if (button_response && (button_response.body === 'hindi' || button_response.body === 'english' || button_response.body === 'gujarati')){
      await this.message.sendWelcomeMessage(from,button_response.body);
      await this.userService.setUserPreferredLanguage(from,button_response.body,this.botId);
      await this.askQuestionButton(from);
      await this.userService.updateUserContext(from,this.botId,'Ask a new question');
    }
    return 'ok';
  }


  private async createButtons(from: string, language: string): Promise<void> {
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
            body: 'Select your district and know the progress of your district'
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

  private async languageButtons(from: string): Promise<void> {
    const url = `${this.apiUrl}/${this.botId}/messages`;
    const messageData = {
    to: from,
    type: 'button',
    button: {
        body: {
        type: 'text',
        text: {
            body: 'choose language'
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
          type:'solid',
          body:'Gujarati',
          reply:'gujarati'
        }
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
    }
    catch (error) {
    console.error('errors:', error);
    }
}

private async askQuestionButton(from: string): Promise<any> {
  const url = `${this.apiUrl}/${this.botId}/messages`;
  const messageData = {
  to: from,
  type: 'button',
  button: {
      body: {
      type: 'text',
      text: {
          body: 'Ask question to your CM Bhupendrabhai and know the progress of your district'
      },
      },
      buttons: [
      {
          type: 'solid',
          body: 'Ask a new question',
          reply: 'Ask a new question',
      }
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
  }
  catch (error) {
  console.error('errors:', error);
  }
}
}
export default ChatbotService;
