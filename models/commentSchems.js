import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const commentSchema = new Schema({

    storyId:{
        type:Schema.Types.ObjectId,
        ref:'Stories',
        index:true,
        required:[true,'Story Id should be included']
    },

    authorId:{
        type:Schema.Types.ObjectId,
        ref:'Users',
        index:true,
        required:[true,'Author Id should be included']
    },

    commentBody:{
        type:String,
        trim:true,
        required:true,
        minlength:3
    }
},  
    {
        timestamps:true
    }
)

const Comments = mongoose.model('Comments',commentSchema);

export default Comments;
