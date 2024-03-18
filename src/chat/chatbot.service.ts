import { Injectable } from '@nestjs/common';
import IntentClassifier from '../intent/intent.classifier';
import { MessageService } from 'src/message/message.service';
import { UserService } from 'src/model/user.service';
import { localisedStrings as english } from 'src/i18n/en/localised-strings';
import { localisedStrings as hindi } from 'src/i18n/hn/localised-strings';
import { localisedStrings as gujarati } from 'src/i18n/gu/localised-strings';
import { LocalizationService } from 'src/localization/localization.service';

import * as dotenv from 'dotenv';
dotenv.config();

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
    const currentDate = new Date().toISOString().split('T')[0];
    if (userData.lastQuestionDate !== currentDate) {
      userData.questionLimit = 0;
      userData.lastQuestionDate = currentDate;
      await this.userService.updateUserQuestionLimit(from, this.botId, userData.questionLimit, userData.lastQuestionDate);
    }
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
        userData.question_limit+=1;
        await this.userService.updateUserQuestionLimit(from, this.botId, userData.question_limit, userData.lastQuestionDate);
      }
      else{
        await this.message.sendMessageForDailyLimit(from,userData.language);
    const { from, text, button_response, persistent_menu_response } = body;
    console.log('button response is: ', button_response);

    const userData = await this.userService.findUserByMobileNumber(
      from,
      this.botId,
    );
    const localisedStrings = LocalizationService.getLocalisedString(
      userData.language,
    );

    if (
      !button_response &&
      !persistent_menu_response &&
      body.text.body === 'hi'
    ) {
      await this.message.askUserName(from, userData.language);
      await this.userService.updateUserContext(
        from,
        this.botId,
        english.context[3],
      );
    } else if (persistent_menu_response) {
      await this.message.languageButtons(from, userData.language);
      await this.userService.updateButtonResponse(
        from,
        this.botId,
        persistent_menu_response.body,
      );
      await this.userService.updateUserContext(
        from,
        this.botId,
        english.context[1],
      );
    } else if (
      button_response &&
      userData.user_context === english.context[1] &&
      userData.button_response === english.persistent_menu[0]
    ) {
      await this.userService.setUserPreferredLanguage(
        from,
        button_response.body,
        this.botId,
      );
      await this.message.askQuestionButton(from, userData.language);
      await this.userService.updateButtonResponse(
        from,
        this.botId,
        english.context[0],
      );
    } else if (
      button_response &&
      userData.user_context === english.context[1] &&
      userData.button_response === english.context[0]
    ) {
      await this.userService.updateUserContext(
        from,
        this.botId,
        button_response.body,
      );
    } else if (
      userData.user_context === english.context[0] &&
      !button_response
    ) {
      if (userData.question_limit <= 10) {
        console.log(body.text.body);
        if (text.body.toLowerCase() === english.demo_question.toLowerCase()) {
          await this.message.sendMessageForCorrectAns(from, userData.language);
          await this.message.askQuestionButton(from, userData.language);
        } else {
          await this.message.sendMessageForIncorrectAns(
            from,
            userData.language,
          );
          await this.message.askQuestionButton(from, userData.language);
        }
      } else {
        await this.message.sendMessageForDailyLimit(from, userData.language);
      }
    } else if (
      userData.user_context === english.context[3] &&
      !button_response &&
      !persistent_menu_response
    ) {
      await this.message.createButtons(from, userData.language);
      await this.userService.updateUserName(from, this.botId, body.text.body);
    } else if (
      button_response &&
      localisedStrings.district_list.includes(button_response.body) &&
      (body.text === null || body.text === undefined)
    ) {
      await this.message.askUserAdress(from, userData.language);
      await this.userService.updateUserContext(
        from,
        this.botId,
        english.context[2],
      );
    } else if (userData.user_context === english.context[2]) {
      await this.message.languageButtons(from, userData.language);
      await this.userService.updateUserAddress(
        from,
        this.botId,
        body.text.body,
      );
      await this.userService.updateUserContext(from, this.botId, null);
    } else if (
      button_response &&
      (button_response.body === 'hindi' ||
        button_response.body === 'english' ||
        button_response.body === 'gujarati')
    ) {
      await this.message.sendWelcomeMessage(from, button_response.body);
      await this.userService.setUserPreferredLanguage(
        from,
        button_response.body,
        this.botId,
      );
      await this.message.askQuestionButton(from, userData.language);
      await this.userService.updateUserContext(
        from,
        this.botId,
        english.context[0],
      );
    }
    return 'ok';
  }
}
export default ChatbotService;
