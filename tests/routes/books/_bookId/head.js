export default (req, res) => {
  res.send('Head bookId: ' + req.params.bookId)
}
