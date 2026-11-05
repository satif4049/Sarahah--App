 import { isValidObjectId } from "mongoose";
 
 export default class BaseRepository {
   model;
   constructor(model) {
     this.model = model;
   }
   creatDocument(data = {}) {
     return this.model.create(data);
   }
   findDocument({ options = {} } = {}) {
     return this.model.find(options);
   }
   findOneDocument(filter = {}) {
     return this.model.findOne(filter);
   }
   //  findDocumentByID
   findDocumentByID(userId) {
     if (!isValidObjectId(userId)) throw new Error("User_ID Is Not Valid");
     return this.model.findById(userId);
   }
   saveUserDocument() {
     return this.model.save();
   }
   updateDocumentById(_id, data, options) {
     return this.model.findByIdAndUpdate(_id, data, options);
   }
   findOneAndUpdate(filter, data, options) {
     return this.model.findOneAndUpdate(filter, data, options);
   }
 }
 