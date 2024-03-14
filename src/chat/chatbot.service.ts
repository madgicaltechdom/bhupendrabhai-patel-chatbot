import { Injectable } from '@nestjs/common';
import IntentClassifier from '../intent/intent.classifier';
import { MessageService } from 'src/message/message.service';
import { UserService } from 'src/model/user.service';
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
    const { from, text,button_response } = body;
    console.log(body);
    const userData = await this.userService.findUserByMobileNumber(from,this.botId);
    
    if (!(button_response) && body.text.body === 'hi'){
      await this.message.askUserName(from,userData.language)
      let user_context = await this.userService.updateUserContext(from,this.botId,'greeting');
      console.log(user_context);
    }

    else if (userData.user_context === 'greeting' && !(button_response)){
      await this.createButtons(from);
    }

    else if (button_response && (body.text === null || body.text === undefined)){
      await this.message.askUserAdress(from,userData.language);
      let user_context = await this.userService.updateUserContext(from,this.botId,button_response.body);
      console.log(user_context);
    }
    if (userData.language === 'english' || userData.language === 'hindi') {
      // await this.userService.saveUser(userData);
    }
    return 'ok';
  }

  private async createButtons(from: string): Promise<void> {
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
        buttons: [
          {
            type: 'solid',
            body: 'Ahmedabad',
            reply: 'Ahmedabad',
          },
          {
            type: 'solid',
            body: 'Amreli',
            reply: 'Amreli',
          },
          {
            type: 'solid',
            body: 'Anand',
            reply: 'Anand',
          },
          {
            type: 'solid',
            body: 'Aravalli',
            reply: 'Aravalli',
          },
          {
            type: 'solid',
            body: 'Banaskantha',
            reply: 'Banaskantha',
          },
          {
            type: 'solid',
            body: 'Bharuch',
            reply: 'Bharuch',
          },
          {
            type: 'solid',
            body: 'Bhavnagar',
            reply: 'Bhavnagar',
          },
          {
            type: 'solid',
            body: 'Botad',
            reply: 'Botad',
          },
          {
            type: 'solid',
            body: 'Chhota Udaipur',
            reply: 'Chhota Udaipur',
          },
          {
            type: 'solid',
            body: 'Dahod',
            reply: 'Dahod',
          },
          {
            type: 'solid',
            body: 'Dang',
            reply: 'Dang',
          },
          {
            type: 'solid',
            body: 'Devbhoomi Dwarka',
            reply: 'Devbhoomi Dwarka',
          },
          {
            type: 'solid',
            body: 'Gandhinagar',
            reply: 'Gandhinagar',
          },
          {
            type: 'solid',
            body: 'Gir Somnath',
            reply: 'Gir Somnath',
          },
          {
            type: 'solid',
            body: 'Jamnagar',
            reply: 'Jamnagar',
          },
          {
            type: 'solid',
            body: 'Junagadh',
            reply: 'Junagadh',
          },
          {
            type: 'solid',
            body: 'Kheda',
            reply: 'Kheda',
          },
          {
            type: 'solid',
            body: 'Kutch',
            reply: 'Kutch',
          },
          {
            type: 'solid',
            body: 'Mahisagar',
            reply: 'Mahisagar',
          },
          {
            type: 'solid',
            body: 'Mehsana',
            reply: 'Mehsana',
          },
          {
            type: 'solid',
            body: 'Morbi',
            reply: 'Morbi',
          },
          {
            type: 'solid',
            body: 'Narmada',
            reply: 'Narmada',
          },
          {
            type: 'solid',
            body: 'Navsari',
            reply: 'Navsari',
          },
          {
            type: 'solid',
            body: 'Panchmahal',
            reply: 'Panchmahal',
          },
          {
            type: 'solid',
            body: 'Patan',
            reply: 'Patan',
          },
          {
            type: 'solid',
            body: 'Porbandar',
            reply: 'Porbandar',
          },
          {
            type: 'solid',
            body: 'Rajkot',
            reply: 'Rajkot',
          },
          {
            type: 'solid',
            body: 'Sabarkantha',
            reply: 'Sabarkantha',
          },
          {
            type: 'solid',
            body: 'Surat',
            reply: 'Surat',
          },
          {
            type: 'solid',
            body: 'Surendranagar',
            reply: 'Surendranagar',
          },
          {
            type: 'solid',
            body: 'Tapi',
            reply: 'Tapi',
          },
          {
            type: 'solid',
            body: 'Vadodara',
            reply: 'Vadodara',
          },
          {
            type: 'solid',
            body: 'Valsad',
            reply: 'Valsad',
          }        ],
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

}
export default ChatbotService;
