import sys
from PIL import Image
from rembg import remove
import random

try:
    input_path =sys.argv[1]
    output_path = './upload/'+str(random.randint(0,1000000))+'.png'
    input_image= Image.open(input_path)
    output_image= remove(input_image)
    output_image.save(output_path)
    print(output_path, end ="")
    sys.stdout.flush()
except Exception as e:
    print(sys.argv[1])