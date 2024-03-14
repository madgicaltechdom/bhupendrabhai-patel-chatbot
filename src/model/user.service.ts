import { Injectable } from '@nestjs/common';
import { dynamoDBClient } from '../config/dynamoDBClient';
import { v4 as uuidv4 } from 'uuid';
import * as dotenv from 'dotenv';
dotenv.config();

const { USERS_TABLE } = process.env;
console.log(USERS_TABLE);

@Injectable()
export class UserService {
  async createUser(
    mobileNumber: string,
    language: string,
    botID: string,
    question: string,
    answer: string,
  ): Promise< any> {
    try {
      const existingUser = await this.findUserByMobileNumber(
        mobileNumber,
        botID,
      );
      if (existingUser) {
        existingUser.language = language;
        existingUser.chatHistory.push({ question, answer })
        if (existingUser.chatHistory.length > 1) {
          existingUser.chatHistory = existingUser.chatHistory.slice(-1);
        }
        const updateUser = {
          TableName: USERS_TABLE,
          Item: existingUser,
        };
        await dynamoDBClient().put(updateUser).promise();
        return existingUser;
      } else {
        const newUser = {
          TableName: USERS_TABLE,
          Item: {
            id: uuidv4(),
            mobileNumber: mobileNumber,
            language: "English",
            Botid:botID,
            chatHistory: [{ question, answer }],
            button_response:null,
            user_context: null

          },
        };
        await dynamoDBClient().put(newUser).promise();
        return newUser;
      }
    } catch (error) {
      console.error('Error in createUser:', error);
      throw error;
    }
  }
  async setUserPreferredLanguage(
    mobileNumber: string,
    language: string,botID:string
  ): Promise<void> {
    const user = await this.findUserByMobileNumber(mobileNumber,botID);
    if (user) {
      user.language = language;
      const setLanguage = {
        TableName: USERS_TABLE,
        Item: user,
      };
      await dynamoDBClient().put(setLanguage).promise();
    } else {
    
      const newUser = {
        TableName: USERS_TABLE,
        Item: {
          id: uuidv4(),
          mobileNumber,
        language:"English",
        Botid:botID,
        chatHistory: [],
        button_response:null,
        user_context: null

        },
      };
      await dynamoDBClient().put(newUser).promise();
    }
  }
  async findUserByMobileNumber(
    mobileNumber: string,
    botID?: string,
  ): Promise<any> {
    const params: any = {
      TableName: USERS_TABLE,
      KeyConditionExpression: 'mobileNumber = :mobileNumber',
      ExpressionAttributeValues: {':mobileNumber': mobileNumber},
    };
    try {
      const result = await dynamoDBClient().query(params).promise();
      let user = result.Items && result.Items.length > 0 ? result.Items[0] : null;

      console.log(user);
      
      if (!user || user?.language === "") {
        user = {
          ...user,
          id: uuidv4(),
          mobileNumber,
        language:"English",
        Botid:botID,
        chatHistory: [],
        button_response:null
        
        };
      
        const setLanguage = {
          TableName: USERS_TABLE,
          Item: user,
        };
      
        await dynamoDBClient().put(setLanguage).promise();
      }
      return user
      
    } catch (error) {
      console.error('Error querying user from DynamoDB:', error);
      return null;
    }
  }

  // async saveUser(user: User): Promise<User | any> {
  //   const newUser = {
  //     TableName: USERS_TABLE,
  //     Item: user,
  //   };
  //   return await dynamoDBClient().put(newUser).promise();
  // }

  async clearUserChatHistory(mobileNumber: string, botID: string): Promise<void> {
    const user = await this.findUserByMobileNumber(mobileNumber, botID);
    if (user) {
        user.chatHistory = [];
        const clearChatHistory = {
            TableName: USERS_TABLE,
            Item: user,
        };
        await dynamoDBClient().put(clearChatHistory).promise();
    } else {
      const newUser = {
        TableName: USERS_TABLE,
        Item: {
          id: uuidv4(),
          mobileNumber,
        language:"English",
        Botid:botID,
        chatHistory: [],
        button_response:null,
        user_context: null
        },
      };
      await dynamoDBClient().put(newUser).promise();
    }
}

async updateUserContext(mobileNumber: string, botID: string, user_context: string): Promise<any> {
  const user = await this.findUserByMobileNumber(mobileNumber, botID);
  
  if (user) {
    user.user_context = user_context;
    const updateParams = {
      TableName: USERS_TABLE,
      Item: user,
    };
    await dynamoDBClient().put(updateParams).promise();
    return user;
  } else {
    const newUser = {
      TableName: USERS_TABLE,
      Item: {
        id: uuidv4(),
        mobileNumber,
        language: "English",
        Botid: botID,
        chatHistory: [],
        button_response: null,
        user_context: user_context
      },
    };
    await dynamoDBClient().put(newUser).promise();
    return newUser;
  }
}

}