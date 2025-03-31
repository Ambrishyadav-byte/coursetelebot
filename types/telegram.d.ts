declare module 'node-telegram-bot-api' {
  namespace TelegramBot {
    interface PollingOptions {
      interval?: number;
      autoStart?: boolean;
      params?: {
        timeout?: number;
        limit?: number;
        offset?: number;
      };
    }

    interface WebHookOptions {
      host?: string;
      port?: number;
      key?: string;
      cert?: string;
      pfx?: string;
      autoOpen?: boolean;
      https?: any;
      healthEndpoint?: string;
    }

    interface ConstructorOptions {
      polling?: boolean | PollingOptions;
      webHook?: boolean | WebHookOptions;
      baseApiUrl?: string;
      filepath?: boolean;
      onlyFirstMatch?: boolean;
      request?: any;
      skipUpdates?: boolean;
    }

    interface User {
      id: number;
      is_bot: boolean;
      first_name: string;
      last_name?: string;
      username?: string;
    }

    interface Chat {
      id: number;
      type: string;
      title?: string;
      username?: string;
      first_name?: string;
      last_name?: string;
    }

    interface Message {
      message_id: number;
      from?: User;
      date: number;
      chat: Chat;
      text?: string;
      entities?: any[];
      reply_to_message?: Message;
    }

    interface CallbackQuery {
      id: string;
      from: User;
      message?: Message;
      inline_message_id?: string;
      chat_instance?: string;
      data?: string;
      game_short_name?: string;
    }

    interface SendMessageOptions {
      parse_mode?: string;
      disable_web_page_preview?: boolean;
      disable_notification?: boolean;
      reply_to_message_id?: number;
      reply_markup?: any;
    }

    interface EditMessageTextOptions {
      chat_id?: number | string;
      message_id?: number;
      inline_message_id?: string;
      parse_mode?: string;
      disable_web_page_preview?: boolean;
      reply_markup?: any;
    }

    interface AnswerCallbackQueryOptions {
      text?: string;
      show_alert?: boolean;
      url?: string;
      cache_time?: number;
    }
    
    interface InlineKeyboardButton {
      text: string;
      url?: string;
      callback_data?: string;
      web_app?: any;
      login_url?: any;
      switch_inline_query?: string;
      switch_inline_query_current_chat?: string;
      callback_game?: any;
      pay?: boolean;
    }
  }

  class TelegramBot {
    constructor(token: string, options?: TelegramBot.ConstructorOptions);

    stopPolling(): Promise<any>;
    isPolling(): boolean;
    sendMessage(chatId: number | string, text: string, options?: TelegramBot.SendMessageOptions): Promise<TelegramBot.Message>;
    answerCallbackQuery(callbackQueryId: string, options?: TelegramBot.AnswerCallbackQueryOptions): Promise<boolean>;
    editMessageText(text: string, options?: TelegramBot.EditMessageTextOptions): Promise<TelegramBot.Message | boolean>;
    
    onText(regexp: RegExp, callback: (msg: TelegramBot.Message, match?: RegExpExecArray | null) => void): void;
    on(event: string, listener: (...args: any[]) => void): this;
  }

  export = TelegramBot;
}