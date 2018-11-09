/**
 * Collection of random reusable utility functions
 */
module.exports = {
    isOwner: (user, obj, param) => {
        const member = (obj ? obj[param] : {});
        if (typeof member === 'object' && member.length) {
            for (let element of member) {
                const { _id } = element;
                if (user && _id && _id.equals(user._id)) {
                    return true;
                }
            }
        } else {
            const { _id } = member;
            return (user && _id && _id.equals(user._id));
        }

        return false;
    },

    // return all objects in the given array that are owned by the given user
    filterUserOwned: (user, objs) => {
        return (user ? objs.filter((obj) => { return obj.user && user._id.equals(obj.user._id); }) : []);
    },

    // clip the input text to the desired length
    limitText: (txt, len) => {
        if (txt && txt.length > len) {
            return txt.slice(0, len) + `...`;
        }
    
        return txt;
    },
}
