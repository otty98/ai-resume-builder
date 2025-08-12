import os
import site
from pathlib import Path

# Find the pyresparser installation directory
def find_pyresparser_path():
    for site_packages in site.getsitepackages():
        pyresparser_path = Path(site_packages) / "pyresparser"
        if pyresparser_path.exists():
            return pyresparser_path
    return None

def create_config_file():
    pyresparser_path = find_pyresparser_path()
    if not pyresparser_path:
        print("❌ Could not find pyresparser installation")
        return False
    
    config_path = pyresparser_path / "config.cfg"
    
    # Create a basic config file
    config_content = """
[nlp]
lang = "en"
pipeline = ["tok2vec", "tagger", "parser", "attribute_ruler", "lemmatizer", "ner"]

[components]

[components.tok2vec]
factory = "tok2vec"

[components.tagger]
factory = "tagger"

[components.parser]
factory = "parser"

[components.attribute_ruler]
factory = "attribute_ruler"

[components.lemmatizer]
factory = "lemmatizer"

[components.ner]
factory = "ner"

[system]
gpu_allocator = null
seed = 0

[training]
dev_corpus = "corpora.dev"
train_corpus = "corpora.train"
seed = ${system.seed}
gpu_allocator = ${system.gpu_allocator}

[training.batcher]
@batchers = "spacy.batch_by_words.v1"
discard_oversize = false
tolerance = 0.2
get_length = null

[training.batcher.size]
@schedules = "compounding.v1"
start = 100
stop = 1000
compound = 1.001
t = 0.0

[training.logger]
@loggers = "spacy.ConsoleLogger.v1"
progress_bar = false

[training.optimizer]
@optimizers = "Adam.v1"
beta1 = 0.9
beta2 = 0.999
L2_is_weight_decay = true
L2 = 0.01
grad_clip = 1.0
use_averages = false
eps = 0.00000001

[training.optimizer.learn_rate]
@schedules = "warmup_linear.v1"
warmup_steps = 250
total_steps = 20000
initial_rate = 0.00005

[training.score_weights]
tag_acc = 0.33
dep_uas = 0.17
dep_las = 0.17
ents_f = 0.33

[corpora]

[corpora.dev]
@readers = "spacy.Corpus.v1"
path = ${paths.dev}
max_length = 0
gold_preproc = false
limit = 0
augmenter = null

[corpora.train]
@readers = "spacy.Corpus.v1"
path = ${paths.train}
max_length = 0
gold_preproc = false
limit = 0
augmenter = null

[paths]
train = null
dev = null
vectors = null
init_tok2vec = null

[pretraining]

[initialize]
vectors = ${paths.vectors}
init_tok2vec = ${paths.init_tok2vec}
vocab_data = null
lookups = null
before_init = null
after_init = null

[initialize.components]

[initialize.tokenizer]
"""

    try:
        with open(config_path, 'w', encoding='utf-8') as f:
            f.write(config_content)
        print(f"✅ Created config file at: {config_path}")
        return True
    except Exception as e:
        print(f"❌ Failed to create config file: {e}")
        return False

if __name__ == "__main__":
    print("Looking for pyresparser installation...")
    if create_config_file():
        print("Config file created successfully!")
    else:
        print("Failed to create config file.")