function getFontScale() {
  var el = document.createElement('div');
  el.style.cssText = 'display:inline-block; padding:0; line-height:1; position:absolute; visibility:hidden; font-size:100px';
  el.appendChild(document.createTextNode('M'));
  document.body.appendChild(el);
  var fs = el.offsetHeight;
  document.body.removeChild(el);
  return fs / 100;
}

ClusterIcon.prototype.oldCreateCss = ClusterIcon.prototype.createCss;
ClusterIcon.prototype.createCss = function(pos) {
  var fontScale = getFontScale();

  var style = ['background-image:' + this.url_ + ';border-radius:50%;'];
  var modifier = Math.round(Math.sqrt(this.sums_.text));

  if (typeof this.anchor_ === 'object') {
    if (typeof this.anchor_[0] === 'number' && this.anchor_[0] > 0 &&
        this.anchor_[0] < this.height_) {
      style.push('height:' + (this.height_ + modifier - this.anchor_[0]) + 'px; padding-top:' + this.anchor_[0] + 'px;');
    } else {
      style.push('height:' + (this.height_ + modifier) + 'px; line-height:' + (this.height_ + modifier) / fontScale + 'px;');
    }
    if (typeof this.anchor_[1] === 'number' && this.anchor_[1] > 0 &&
        this.anchor_[1] < this.width_) {
      style.push('width:' + (this.width_ + modifier - this.anchor_[1]) + 'px; padding-left:' + this.anchor_[1] + 'px;');
    } else {
      style.push('width:' + (this.width_ + modifier) + 'px; text-align:center;');
    }
  } else {
    style.push('height:' + (this.height_ + modifier) + 'px; line-height:' +
        (this.height_ + modifier) / fontScale + 'px; width:' + (this.width_ + modifier) + 'px; text-align:center;');
  }

  var txtColor = this.textColor_ || 'black';
  var txtSize = ((this.textSize_ || 11) + modifier / (this.sums_.text + '').length) / fontScale;

  style.push('cursor:pointer; top:' + pos.y + 'px; left:' +
      pos.x + 'px; color:' + txtColor + '; position:absolute; font-size:' +
      txtSize + 'px; font-family:Arial,sans-serif; font-weight:bold');
  return style.join('');
};