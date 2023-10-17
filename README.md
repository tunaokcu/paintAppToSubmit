# paintApp
Paint app developed for Bilkent University's graphics course. Specifications listed here: http://sinan.sonlu.bilkent.edu.tr/cs465/assignment1-triangle/

I couldn't handle zooming in and out and panning, but I wrote functions to keep track of whether these actions are being initiated and how much the user is zooming in and out, and in what direction they are moving the screen and the distance they are moving it in. I added console.log statements to print these out to console so that the correctness of these can be verified. As it is, zooming in and out will not make any display changes. However, it is being tracked. 

An apparent bug(or bad design choice): when a selection rectangle is dragged, what's added to the ctrl-z ctrl-y stack is not just one stroke but 2 * n strokes where n is the number of blocks the rectangle is dragged. One erasure operation and one draw operation is registered for each block moved. So when, after a long drag operation, the user holds down ctrl-z, they will witness the rectangle moving back to its original location, flickering as it does(instead of it being instantly placed back to its original location). 

In addition, ctrl-y causes bugs after selection has been used.