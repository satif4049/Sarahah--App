import Message from "../Models/message.js";
import BaseRepository from "./base.repositor.js";


export default class MessageRepository extends BaseRepository{
      constructor(){
        super(Message)
      }
}