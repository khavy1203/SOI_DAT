const handleHelloWord = (req, res) => {
    const render = "1234";
    return res.render("home.ejs", { render });
}
const handleUserPage = (req, res) => {
    return res.render("user.ejs")
}
module.exports = {
    handleHelloWord,
    handleUserPage
}