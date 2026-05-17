def text_wrapper(text, threshold = 50):
    nodes = (',', '(', ' ')
    new_text = []

    while text:
        if len(text) <= threshold:
            new_text.append(text)
            break

        piece = text[:threshold]
        isPieced = False
        for n in nodes:
            idx = piece.rfind(n)
            if idx != -1:
                new_text.append(piece[:idx + 1].strip())
                text = text[idx + 1:].strip()
                isPieced = True
                break

        if not isPieced:
            new_text.append(piece.strip())
            text = text[threshold:].strip()

    return '\\\\'.join(new_text), len(new_text)
