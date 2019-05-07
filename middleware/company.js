module.exports = {
    /**
     * Passes if there is a valid user,
     * and the charity referenced in req is found
     */
    canVerifyCompany: (user) => {
        return (user.username.indexOf("@playvested.com") == user.username.length - "@playvested.com".length);
    },
}
