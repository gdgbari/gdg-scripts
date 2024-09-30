import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore
import os, segno, secrets
from PIL import Image
import os 
from PIL import Image
from pypdf import PdfWriter, PaperSize, Transformation, PdfReader
import argparse

from io import BytesIO

#py main.py -t polpo -n 50 && py main.py -t focaccia -n 50 && py main.py -t orecchiette -n 50 && py main.py -t panzerotto -n 50

parser = argparse.ArgumentParser()
parser.add_argument("-t", help="Team name", required=True)
parser.add_argument("--qrtype", help="QR type", default="checkin")
parser.add_argument("-n", help="Number of QR codes to generate", required=True, type=int)
args = parser.parse_args()
# CONFIGS HERE!

qrcode_to_gen = args.n
team = args.t
qrtype = args.qrtype
fake_qr = False

# END CONFIGS

teams_data = {
    "polpo": {
        "name": "polpo",
        "logo": "team_polpo.png",
    },
    "focaccia": {
        "name": "focaccia",
        "logo": "team_focaccia.png",
    },
    "orecchiette": {
        "name": "orecchiette",
        "logo": "team_orecchiette.png",
    },
    "panzerotto": {
        "name": "panzerotto",
        "logo": "team_panzerotto.png",
    },
}

if team not in teams_data.keys():
    exit("Team not found")

if qrtype not in ["checkin"]:
    exit("Invalid QR type")
    
if qrcode_to_gen < 1:
    exit("Invalid number of QR codes")

os.chdir(os.path.dirname(__file__))

team_name = teams_data[team]["name"]
bgimage = teams_data[team]["logo"]

cred = credentials.Certificate("./firebase-keys.json")
firebase_admin.initialize_app(cred)

db = firestore.client()

os.makedirs("qrcodes", exist_ok=True)
os.makedirs("pdfs", exist_ok=True)

groups = db.collection("groups").get()
group = [group for group in groups if group.get("name") == team_name]
if len(group) == 0:
    exit(f"Team '{team_name}' not found")
group = group[0]

codes_gen = []

for i in range(qrcode_to_gen):
    if not fake_qr:
        new_token = db.collection("authorizationCodes").add({
            "expired": False,
            "group": group.reference,
        })

        if new_token[1]:
            new_token = new_token[1].id
            codes_gen.append(new_token)
        else:
            exit("Error creating token")
    else:
        new_token = secrets.token_hex(6)
        codes_gen.append(new_token)

    out = BytesIO()
    qrcode = segno.make_qr(qrtype + ":" + new_token, error='h')
    qrcode.save(out, scale=20, kind='png', border=2)
    out.seek(0)
    img = Image.open(out)
    img = img.convert('RGBA')
    img_width, img_height = img.size
    logo_max_size = img_height // 3
    logo_img = Image.open(f"{bgimage}").convert('RGBA')
    logo_img.thumbnail((logo_max_size, logo_max_size), Image.Resampling.LANCZOS)
    box = ((img_width - logo_img.size[0]) // 2, (img_height - logo_img.size[1]) // 2)
    img.paste(logo_img, box, logo_img)
    img.save(f"qrcodes/{new_token}_{qrtype}.png")
    
images = [ Image.open(f"qrcodes/{code}_{qrtype}.png") for code in codes_gen ]

images[0].save(
    f"pdfs/separated_{team_name}_{qrtype}_{qrcode_to_gen}_{secrets.token_hex(3)}.pdf", "PDF" ,resolution=100.0, save_all=True, append_images=images[1:]
)

filenames = [f"qrcodes/{code}_{qrtype}.png" for code in codes_gen]

# Convert an image to a PDF
def image_to_pdf(image):
    pdf_bytes = BytesIO()
    image.save(pdf_bytes, format='PDF')
    pdf_bytes.seek(0)
    return PdfReader(pdf_bytes)
 
# Set the dimensions of each image and grid cell 

 
# Create a new PDF document 
output_pdf = PdfWriter() 
paper = PaperSize.A4

border = 15

paper_width, paper_height = paper.width-border*2, paper.height-border*2
# Loop through the images

qrcodes_on_row = 7
qrcodes_on_col = 5

qrcode_size = min(paper_height//qrcodes_on_row, paper_width//qrcodes_on_col)

img_width, img_height = qrcode_size, qrcode_size

used_width = border
used_height = border

page = output_pdf.add_blank_page(width=paper.width, height=paper.height)
for filename in filenames: 
    # Open the image and resize it to fit the grid cell 
    img = Image.open(filename)
    img = img.resize((img_width, img_height)) 

    if used_width + img_width - border > paper_width:
        used_width = border
        used_height += img_height
    if used_height + img_height - border > paper_height:
        used_height = border
        used_width = border
        page = output_pdf.add_blank_page(width=paper.width, height=paper.height)
    
    page.merge_transformed_page(
        image_to_pdf(img).pages[0],
        Transformation().translate(used_width, used_height)
    )
    used_width += img_width 
         
# Save the PDF document 
with open(f"pdfs/{team_name}_{qrtype}_{qrcode_to_gen}_{secrets.token_hex(3)}.pdf", 'wb') as f: 
    output_pdf.write(f) 
