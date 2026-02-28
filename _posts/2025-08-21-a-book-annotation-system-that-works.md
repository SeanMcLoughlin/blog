---
layout: post
title: "A book annotation system that works"
date: 2025-08-21
permalink: /a-book-annotation-system-that-works/
---
I've gone back and forth on my preferred reading medium over the years, between physical books and e-books. Surely, you can imagine the pros and cons of each medium at face-value. I find that both mediums have their place, depending on the situation. I prefer fiction to be a physical book, because I want to relax and unwind to a story without LEDs beaming into my eyes. For large works, an e-book works well for its portability and weight. However, I think that neither medium has fully solved my problems with annotations.

A reading setup that supports annotations well has follow two traits: **persistence**, and **editability.** 

Physical books are persistent because a physical copy persists – it will remain on my bookshelf for as long as I wish to keep it there. However, they are not editable. After I annotate on the physical book, I cannot remove the annotation (cleanly, at least). My only options are to write with a pencil and smudge out errors with an eraser (this doesn't work), or to buy a new physical copy (this is cost-prohibitive).

On the other hand, e-books (as most people use them) provide editability in that you are able to remove annotations after they're added. But they do not provide persistence because most people purchase and read e-books in a vendor locked application, such as Kindle or Apple iBooks. This denies you the ability to export your .epub files with annotations.[^1] 

I host a Calibre e-book library. This is how I use it:

1. Host a golden copy of an e-book with a Calibre server.
2. Download a copy of that e-book from the server on the device they want to read on.
3. Read the e-book on that device with whatever software they prefer.

But because you're reading a copy, this setup is still not persistent, as annotations are not synced back to Calibre. Sure, you could re-upload the book with annotations to Calibre, but this is a layer of friction I'd like to avoid. This requires me to use something like Tailscale to access the network my NAS lives on if I'm away from home, in contrast to the simplicity of just syncing with "The Cloud." This also overwrites your golden copy. What if you want to share this book with friends or family, but not the annotations on that book?

This has led me to my current annotation work-flow which, while not fancy, is both persistent and editable:

1. Read with whichever medium you want.
2. If you want to annotate something, you have to rewrite the annotation word-for-word in a note, citing the work.

This is persistent so long as I save my notes. It is editable because I can delete the annotation if I choose to without damaging the source material. And, crucially, it does not tie the annotation to the medium, meaning that syncing your annotations back to the server hosting the golden copy is no longer a problem that needs solving.

There's an argument to be made that this is actually the best approach, because the act of rewriting is a way to think harder about the annotated text. I mostly agree with this, but there is friction if I am reading something on a tablet or my phone that I want annotated. Dictation software has gotten so good these days, though, that dictating the annotation into my note is relatively quick and easy.

It's not a great technical achievement, but it gets the job done.

[^1]: If you purchased the e-book from these vendors, it's not even likely you'll be able to export the file. If you can, it will be locked with DRM, so you cannot read it outside of applications like Adobe Digital Editions. You should purchase your e-books from vendors that sell DRM-free e-books, like ebooks.com.

