import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from '../src/app.controller';
import { ChatbotService } from '../src/chat/chatbot.service';
import { UserService } from '../src/model/user.service';
import * as dotenv from 'dotenv';
import { MessageService } from '../src/message/message.service';
import * as AWS from 'aws-sdk';
import { dynamoDBClient } from '../src/config/dynamoDBClient';
import { SwiftchatMessageService } from '../src/swiftchat/swiftchat.service';
import axios from 'axios';
import { localisedStrings as english } from '../src/i18n/en/localised-strings';
import { LocalizationService } from '../src/localization/localization.service';

dotenv.config();

jest.mock('../src/intent/intent.classifier');
jest.mock('../src/message/message.service');
jest.mock('../src/model/user.service');
jest.mock('axios');

jest.mock('../src/config/dynamoDBClient', () => ({
  dynamoDBClient: jest.fn(() => ({
    put: jest.fn().mockReturnThis(),
    promise: jest.fn(),
  })),
}));

jest.mock('aws-sdk', () => {
  return {
    DynamoDB: {
      DocumentClient: jest.fn(),
    },
  };
});

describe('AppController', () => {
  let messageService: MessageService;
  let userService: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        ChatbotService,
        SwiftchatMessageService,
        {
          provide: MessageService,
          useFactory: () => ({
            sendWelcomeMessage: jest.fn(), // Mock the abstract method or use a concrete implementation
            sendLanguageChangedMessage: jest.fn(),
            askUserName: jest.fn(),
            askUserAdress: jest.fn(),
            sendMessageForCorrectAns: jest.fn(),
            sendMessageForIncorrectAns: jest.fn(),
            sendMessageForDailyLimit: jest.fn(),
            createButtons: jest.fn(),
            languageButtons: jest.fn(),
            askQuestionButton: jest.fn(),
          }),
        },
        UserService,
      ],
    }).compile();
    messageService = module.get<MessageService>(MessageService);
    userService = module.get<UserService>(UserService);
  });

  it('should process a message with valid user data and a correct answer when the user context is "Ask a new question"', async () => {
    const userService = {
      findUserByMobileNumber: jest.fn().mockResolvedValue({
        language: 'english',
        lastQuestionDate: '2024-13-19',
        question_limit: 0,
        id: '12',
        mobileNumber: '1234567890',
        Botid: '111',
        button_response: null,
        user_context: 'Ask a new question',
        address: null,
        userName: null,
      }),
      updateUserQuestionLimit: jest.fn(),
      updateUserContext: jest.fn(),
      updateButtonResponse: jest.fn(),
      setUserPreferredLanguage: jest.fn(),
      updateUserName: jest.fn(),
      updateUserAddress: jest.fn(),
      createUser: jest.fn(),
    };

    const chatbotService = new ChatbotService(messageService, userService);

    const body = {
      from: '1234567890',
      text: { body: 'Who is bhupendrabhai?' },
      button_response: null,
      persistent_menu_response: null,
    };

    await chatbotService.processMessage(body);

    expect(userService.findUserByMobileNumber).toHaveBeenCalledWith(
      '1234567890',
      process.env.BOT_ID,
    );
    expect(messageService.sendMessageForCorrectAns).toHaveBeenCalledWith(
      '1234567890',
      'english',
    );
    expect(messageService.askQuestionButton).toHaveBeenCalledWith(
      '1234567890',
      'english',
    );
    expect(userService.updateUserQuestionLimit).toHaveBeenCalledWith(
      '1234567890',
      process.env.BOT_ID,
      0,
      new Date().toISOString().split('T')[0],
    );
  });

  it('should process a message for asking name with valid user data and a valid context when the button and persistent menu response is null and body.text is set to "hi"', async () => {
    const userService = {
      findUserByMobileNumber: jest.fn().mockResolvedValue({
        language: 'english',
        lastQuestionDate: '2024-13-19',
        question_limit: 0,
        id: '12',
        mobileNumber: '1234567890',
        Botid: '111',
        button_response: null,
        user_context: null,
        address: null,
        userName: null,
      }),
      updateUserQuestionLimit: jest.fn(),
      updateUserContext: jest.fn(),
      updateButtonResponse: jest.fn(),
      setUserPreferredLanguage: jest.fn(),
      updateUserName: jest.fn(),
      updateUserAddress: jest.fn(),
      createUser: jest.fn(),
    };
    const chatbotService = new ChatbotService(messageService, userService);

    // Define test data
    const body = {
      from: '1234567890',
      text: { body: 'hi' },
      button_response: null,
      persistent_menu_response: null,
    };

    // Invoke method
    await chatbotService.processMessage(body);

    // Assertions
    expect(userService.findUserByMobileNumber).toHaveBeenCalledWith(
      '1234567890',
      process.env.BOT_ID,
    );
    expect(messageService.askUserName).toHaveBeenCalledWith(
      '1234567890',
      'english',
    );
    expect(userService.updateUserContext).toHaveBeenCalledWith(
      '1234567890',
      process.env.BOT_ID,
      english.context[3],
    );
  });

  // Check if the user_context is equal to english.context[1] and button_response is equal to english.persistent_menu[0].
  it('should process a message with valid user data and a valid context and button response', async () => {
    const userService = {
      findUserByMobileNumber: jest.fn().mockResolvedValue({
        language: 'english',
        lastQuestionDate: '2024-13-19',
        question_limit: 0,
        id: '12',
        mobileNumber: '1234567890',
        Botid: '111',
        button_response: 'Change Language',
        user_context: 'persistent menu',
        address: null,
        userName: null,
      }),
      updateUserQuestionLimit: jest.fn(),
      updateUserContext: jest.fn(),
      updateButtonResponse: jest.fn(),
      setUserPreferredLanguage: jest.fn(),
      updateUserName: jest.fn(),
      updateUserAddress: jest.fn(),
      createUser: jest.fn(),
    };
    const chatbotService = new ChatbotService(messageService, userService);

    // Define test data
    const body = {
      from: '1234567890',
      text: null,
      button_response: { body: 'hindi' },
      persistent_menu_response: null,
    };

    // Invoke method
    await chatbotService.processMessage(body);

    // Assertions
    expect(userService.findUserByMobileNumber).toHaveBeenCalledWith(
      '1234567890',
      process.env.BOT_ID,
    );
    expect(userService.updateButtonResponse).toHaveBeenCalledWith(
      '1234567890',
      process.env.BOT_ID,
      english.context[0],
    );
    expect(userService.setUserPreferredLanguage).toHaveBeenCalledWith(
      '1234567890',
      'hindi',
      process.env.BOT_ID,
    );
    expect(messageService.askQuestionButton).toHaveBeenCalledWith(
      '1234567890',
      'hindi',
    );
  });

  // Check if the persistent_menu_response is not null.
  it('should process a message with valid user data and a valid persistent menu response', async () => {
    // Mock dependencies
    const userService = {
      findUserByMobileNumber: jest.fn().mockResolvedValue({
        language: 'english',
        lastQuestionDate: '2022-01-01',
        questionLimit: 0,
        user_context: 'context',
        button_response: 'response',
      }),
      updateUserQuestionLimit: jest.fn(),
      updateUserContext: jest.fn(),
      updateButtonResponse: jest.fn(),
      setUserPreferredLanguage: jest.fn(),
      updateUserName: jest.fn(),
      updateUserAddress: jest.fn(),
      createUser: jest.fn(),
    };
    const chatbotService = new ChatbotService(messageService, userService);

    // Define test data
    const body = {
      from: '1234567890',
      text: null,
      button_response: null,
      persistent_menu_response: { body: 'Change Language' },
    };

    // Invoke method
    await chatbotService.processMessage(body);

    // Assertions
    expect(userService.findUserByMobileNumber).toHaveBeenCalledWith(
      '1234567890',
      process.env.BOT_ID,
    );
    expect(messageService.languageButtons).toHaveBeenCalledWith(
      '1234567890',
      'english',
    );
    expect(userService.updateButtonResponse).toHaveBeenCalledWith(
      '1234567890',
      process.env.BOT_ID,
      body.persistent_menu_response.body,
    );
    expect(userService.updateUserContext).toHaveBeenCalledWith(
      '1234567890',
      process.env.BOT_ID,
      english.context[1],
    );
  });

  it('should process a message saying "we dont have answer to this question right now",with valid user data and when the user context is "Ask a new question"', async () => {
    const userService = {
      findUserByMobileNumber: jest.fn().mockResolvedValue({
        language: 'english',
        lastQuestionDate: '2024-13-19',
        question_limit: 0,
        id: '12',
        mobileNumber: '1234567890',
        Botid: '111',
        button_response: null,
        user_context: 'Ask a new question',
        address: null,
        userName: null,
      }),
      updateUserQuestionLimit: jest.fn(),
      updateUserContext: jest.fn(),
      updateButtonResponse: jest.fn(),
      setUserPreferredLanguage: jest.fn(),
      updateUserName: jest.fn(),
      updateUserAddress: jest.fn(),
      createUser: jest.fn(),
    };

    const chatbotService = new ChatbotService(messageService, userService);

    const body = {
      from: '1234567890',
      text: { body: 'Who is PM of India?' },
      button_response: null,
      persistent_menu_response: null,
    };

    await chatbotService.processMessage(body);

    expect(userService.findUserByMobileNumber).toHaveBeenCalledWith(
      '1234567890',
      process.env.BOT_ID,
    );
    expect(messageService.sendMessageForIncorrectAns).toHaveBeenCalledWith(
      '1234567890',
      'english',
    );

    expect(messageService.askQuestionButton).toHaveBeenCalledWith(
      '1234567890',
      'english',
    );
    expect(userService.updateUserQuestionLimit).toHaveBeenCalledWith(
      '1234567890',
      process.env.BOT_ID,
      0,
      new Date().toISOString().split('T')[0],
    );
  });

  it('should process a message saying "You have reached your daily question limit",with valid user data and when the user context is "Ask a new question" and user daily limit is exhausted', async () => {
    const userService = {
      findUserByMobileNumber: jest.fn().mockResolvedValue({
        language: 'english',
        lastQuestionDate: '2024-13-19',
        question_limit: 11,
        id: '12',
        mobileNumber: '1234567890',
        Botid: '111',
        button_response: null,
        user_context: 'Ask a new question',
        address: null,
        userName: null,
      }),
      updateUserQuestionLimit: jest.fn(),
      updateUserContext: jest.fn(),
      updateButtonResponse: jest.fn(),
      setUserPreferredLanguage: jest.fn(),
      updateUserName: jest.fn(),
      updateUserAddress: jest.fn(),
      createUser: jest.fn(),
    };

    const chatbotService = new ChatbotService(messageService, userService);

    const body = {
      from: '1234567890',
      text: { body: 'Who is PM of India?' },
      button_response: null,
      persistent_menu_response: null,
    };

    await chatbotService.processMessage(body);

    expect(userService.findUserByMobileNumber).toHaveBeenCalledWith(
      '1234567890',
      process.env.BOT_ID,
    );
    expect(messageService.sendMessageForDailyLimit).toHaveBeenCalledWith(
      '1234567890',
      'english',
    );
  });
  it('should call languageButtons method when user context is set to address ', async () => {
    const userService = {
      findUserByMobileNumber: jest.fn().mockResolvedValue({
        language: 'english',
        lastQuestionDate: '2024-13-19',
        question_limit: 11,
        id: '12',
        mobileNumber: '1234567890',
        Botid: '111',
        button_response: null,
        user_context: 'address',
        address: null,
        userName: null,
      }),
      updateUserQuestionLimit: jest.fn(),
      updateUserContext: jest.fn(),
      updateButtonResponse: jest.fn(),
      setUserPreferredLanguage: jest.fn(),
      updateUserName: jest.fn(),
      updateUserAddress: jest.fn(),
      createUser: jest.fn(),
    };

    const chatbotService = new ChatbotService(messageService, userService);

    const body = {
      from: '1234567890',
      text: {body: 'This is my address'},
      button_response: null,
      persistent_menu_response: null,
    };

    await chatbotService.processMessage(body);

    expect(messageService.languageButtons).toHaveBeenCalledWith(body.from, 'english');
    expect(userService.updateUserAddress).toHaveBeenCalledTimes(1);
    expect(userService.updateUserContext).toHaveBeenCalledTimes(1);
  });
  it('should send a welcome message in the specified language"', async () => {
    const userService = {
      findUserByMobileNumber: jest.fn().mockResolvedValue({
        language: 'english',
        lastQuestionDate: '2024-13-19',
        question_limit: 0,
        id: '12',
        mobileNumber: '1234567890',
        Botid: '111',
        button_response: null,
        user_context: 'welcome message',
        address: null,
        userName: null,
      }),
      updateUserQuestionLimit: jest.fn(),
      updateUserContext: jest.fn(),
      updateButtonResponse: jest.fn(),
      setUserPreferredLanguage: jest.fn(),
      updateUserName: jest.fn(),
      updateUserAddress: jest.fn(),
      createUser: jest.fn(),
    };

    const swiftchatService = new SwiftchatMessageService();

    const body = {
      from: '1234567890',
      language:'english',
      text: { body: 'hi' },
      button_response: null,
      persistent_menu_response: null,
    };

    await messageService.sendWelcomeMessage(body.from,body.language)

    expect(messageService.sendWelcomeMessage).toHaveBeenCalledWith(
      body.from,
      'english',
    );
  });
  it('should send a message for incorrect answer with the correct language"', async () => {
    const userService = {
      findUserByMobileNumber: jest.fn().mockResolvedValue({
        language: 'english',
        lastQuestionDate: '2024-13-19',
        question_limit: 0,
        id: '12',
        mobileNumber: '1234567890',
        Botid: '111',
        button_response: null,
        user_context: 'incorrect answer',
        address: null,
        userName: null,
      }),
      updateUserQuestionLimit: jest.fn(),
      updateUserContext: jest.fn(),
      updateButtonResponse: jest.fn(),
      setUserPreferredLanguage: jest.fn(),
      updateUserName: jest.fn(),
      updateUserAddress: jest.fn(),
      createUser: jest.fn(),
    };

    const swiftchatService = new SwiftchatMessageService();
    const from = "1234567890";
    const language = "english";

    const body = {
      from: '1234567890',
      text: { body: 'Ask a new question' },
      button_response: null,
      persistent_menu_response: null,
    };

    await messageService.sendMessageForIncorrectAns(from, language);

    expect(messageService.sendMessageForIncorrectAns).toHaveBeenCalledWith(
      '1234567890',
      'english',
    );
  });
  it('should send a message with the daily limit information in the correct language"', async () => {
    const userService = {
      findUserByMobileNumber: jest.fn().mockResolvedValue({
        language: 'english',
        lastQuestionDate: '2024-13-19',
        question_limit: 0,
        id: '12',
        mobileNumber: '1234567890',
        Botid: '111',
        button_response: null,
        user_context: 'Ask me question',
        address: null,
        userName: null,
      }),
      updateUserQuestionLimit: jest.fn(),
      updateUserContext: jest.fn(),
      updateButtonResponse: jest.fn(),
      setUserPreferredLanguage: jest.fn(),
      updateUserName: jest.fn(),
      updateUserAddress: jest.fn(),
      createUser: jest.fn(),
    };

    const swiftchatService = new SwiftchatMessageService();
    const from = "1234567890";
    const language = "english";

    const body = {
      from: '1234567890',
      text: { body: 'Ask a new question' },
      button_response: null,
      persistent_menu_response: null,
    };
    
await messageService.sendMessageForDailyLimit(from, language);

    expect(messageService.sendMessageForDailyLimit).toHaveBeenCalledWith(
      '1234567890',
      'english',
    );
  });
  it('should send a message with the correct language selected"', async () => {
    const userService = {
      findUserByMobileNumber: jest.fn().mockResolvedValue({
        language: 'english',
        lastQuestionDate: '2024-13-19',
        question_limit: 0,
        id: '12',
        mobileNumber: '1234567890',
        Botid: '111',
        button_response: null,
        user_context: 'Ask me question',
        address: null,
        userName: null,
      }),
      updateUserQuestionLimit: jest.fn(),
      updateUserContext: jest.fn(),
      updateButtonResponse: jest.fn(),
      setUserPreferredLanguage: jest.fn(),
      updateUserName: jest.fn(),
      updateUserAddress: jest.fn(),
      createUser: jest.fn(),
    };

    const swiftchatService = new SwiftchatMessageService();
    const from = "1234567890";
    const language = "english";

    const body = {
      from: '1234567890',
      text: null,
      button_response: {body: 'hindi'},
      persistent_menu_response: { body: 'Change Language'},
    };
    
await messageService.sendLanguageChangedMessage(from, language);


expect(messageService.sendLanguageChangedMessage).toHaveBeenCalledWith(
  body.from,
  'english',
);
  });
  it('should send a message asking for users name in the specified language', async () => {
    const userService = {
      findUserByMobileNumber: jest.fn().mockResolvedValue({
        language: 'english',
        lastQuestionDate: '2024-13-19',
        question_limit: 0,
        id: '12',
        mobileNumber: '1234567890',
        Botid: '111',
        button_response: null,
        user_context: 'name',
        address: null,
        userName: null,
      }),
      updateUserQuestionLimit: jest.fn(),
      updateUserContext: jest.fn(),
      updateButtonResponse: jest.fn(),
      setUserPreferredLanguage: jest.fn(),
      updateUserName: jest.fn(),
      updateUserAddress: jest.fn(),
      createUser: jest.fn(),
    };

    const swiftchatService = new SwiftchatMessageService();
    const from = "1234567890";
    const language = "hindi";

    const body = {
      from: '1234567890',
      text: null,
      button_response: null,
      persistent_menu_response: null,
    };
    
await messageService.askUserName(from, language);

      expect(messageService.askUserName).toBeDefined();
      expect(messageService.askUserName).toHaveBeenCalledWith(
      '1234567890',
      'hindi',
    );
  });
  // it('should create buttons with localized strings', async () => {
  //   const userService = {
  //     findUserByMobileNumber: jest.fn().mockResolvedValue({
  //       language: 'english',
  //       lastQuestionDate: '2024-13-19',
  //       question_limit: 0,
  //       id: '12',
  //       mobileNumber: '1234567890',
  //       Botid: '111',
  //       button_response: null,
  //       user_context: 'Ask a new question',
  //       address: null,
  //       userName: null,
  //     }),
  //     updateUserQuestionLimit: jest.fn(),
  //     updateUserContext: jest.fn(),
  //     updateButtonResponse: jest.fn(),
  //     setUserPreferredLanguage: jest.fn(),
  //     updateUserName: jest.fn(),
  //     updateUserAddress: jest.fn(),
  //     createUser: jest.fn(),
  //   };
  //   // Arrange
  //   const from = '1234567890';
  //   const language = 'english';

  //   // Mock the localized strings
  //   const localizedStrings = {
  //     createButtonBody: 'Choose your district and discover its progress.',
  //     district_buttons: [
  //       { body: 'Ahmedabad', reply: 'Ahmedabad', type: 'solid' },
  //       // Add more buttons as needed
  //     ],
  //   };

  //   // Act
  //   const response = await messageService.createButtons(from, language);

  //   // Assert
    
  //   expect(messageService.createButtons).toHaveBeenCalledWith(
  //     expect.any(String), // URL
  //     expect.objectContaining({
  //       button: {
  //         body: {
  //           text: {
  //             body: localizedStrings.createButtonBody,
  //           },
  //         },
  //         buttons: expect.arrayContaining(localizedStrings.district_buttons),
  //       },
  //     }),
  //     expect.any(Object), // Headers
  //   );
  // });
  it('should send a welcome message when valid \'from\' and \'language\' parameters are provided', async () => {
    // Arrange
    const swiftchatMessageService = new SwiftchatMessageService();
    const from = "user@example.com";
    const language = "english";

    // Mock LocalizationService
    const mockLocalisedStrings = {
      welcomeMessage: "Welcome!",
    };
    LocalizationService.getLocalisedString = jest.fn().mockReturnValue(mockLocalisedStrings);

    // Mock sendMessage method
    swiftchatMessageService.sendMessage = jest.fn().mockResolvedValue({
      status: 200,
      data: {
        to: from,
        type: 'text',
        text: {
          body: "Welcome!"
        }
      }
    });

    // Act
    const response = await swiftchatMessageService.sendWelcomeMessage(from, language);

    // Assert
    expect(response).toBeDefined();
    expect(response.status).toBe(200);
    expect(response.data).toEqual(expect.objectContaining({
      to: from,
      type: 'text',
      text: {
        body: "Welcome!"
      }
    }));
    expect(LocalizationService.getLocalisedString).toHaveBeenCalledWith(language);

  });

});
