if (typeof require !== 'undefined') {
  module.exports = function phpjsutil(config) {
    var self = new PhpjsUtil(config);
    return self;
  };
}

function PhpjsUtil(config) {
  this.injectDependencies = [];

  // Overwrite properties with config
  for (var k in config) {
    this[k] = config[k];
  }
}

// Should be overridden by a more sofisticated function
// such as cli.debug when run in node.js
PhpjsUtil.prototype.debug = function(a) {
  return console.log(a);
};

// Should be overridden by a more sofisticated function
// such as assert.deepEqual when run in node.js
PhpjsUtil.prototype.equal = function(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
};

PhpjsUtil.prototype._commentBlocks = function(code) {
  var cnt           = 0;
  var comment       = [];
  var commentBlocks = [];
  var i             = 0;
  var lines         = [];
  var raise         = false;
  for (i in (lines = code.replace('\r', '').split('\n'))) {
    // Detect if line is a comment, and return the actual comment
    if ((comment = lines[i].match(/^\s*(\/\/|\/\*|\*)\s*(.*)$/))) {
      if (raise === true) {
        cnt = commentBlocks.length;
        raise = false;
      }
      if (!commentBlocks[cnt]) {
        commentBlocks[cnt] = {clean: [], raw: []};
      }

      commentBlocks[cnt].clean.push(comment[2].trim());
      commentBlocks[cnt].raw.push(lines[i]);
    } else {
      raise = true;
    }
  }

  return commentBlocks;
};

PhpjsUtil.prototype._headKeys = function(headLines) {
  var i;
  var keys   = {};
  var match  = [];
  var dmatch = [];
  var key    = '';
  var val    = '';
  var num    = 0;

  for (i in headLines) {
    if (!(match = headLines[i].match(/^\s*\W?\s*([a-z\ 0-9]+)\s*:\s*(.*)\s*$/))) {
      continue;
    }
    key = match[1];
    val = match[2];

    if ((dmatch = key.match(/^(\w+)\s+(\d+)$/))) {
      // Things like examples and notes can be grouped
      key = dmatch[1];
      num = dmatch[2] - 1;
    } else {
      num = 0;
    }

    if (!keys[key]) {
      keys[key] = [];
    }
    if (!keys[key][num]) {
      keys[key][num] = [];
    }
    keys[key][num].push(val);
  }

  return keys;
};

PhpjsUtil.prototype.contains = function(array, value) {
  var i = array.length;
  while (i--) {
    if (array[i] === value) {
      return true;
    }
  }
  return false;
};

PhpjsUtil.prototype._loadDependencies = function(name, headKeys, dependencies, cb) {
  var self = this;

  if (!headKeys['depends on'] || !headKeys['depends on'].length) {
    if (cb) {
      cb(null, {});
    }
  }

  var i;
  var depname;
  var loaded = 0;
  for (i in headKeys['depends on']) {
    depname = headKeys['depends on'][i][0];

    self.load(depname, function(err, params) {
      if (err) {
        return cb(err);
      }

      dependencies[depname] = params;
      self._loadDependencies(depname, params.headKeys, dependencies);

      if (cb && ++loaded === headKeys['depends on'].length) {
        cb(null, dependencies);
      }
    });
  }
};

PhpjsUtil.prototype.parse = function(name, code, cb) {
  var patFuncStart  = /^\s*function\s*([^\s\()]+)\s*\(([^\)]*)\)\s*\{\s*/i;
  var patFuncEnd    = /\s*}\s*$/;
  var commentBlocks = this._commentBlocks(code);
  var head          = commentBlocks[0].raw.join('\n');
  var body          = code.replace(head, '');
  body              = body.replace(patFuncStart, '');
  body              = body.replace(patFuncEnd, '');
  var headKeys      = this._headKeys(commentBlocks[0].clean);

  this._loadDependencies(name, headKeys, {}, function(err, dependencies) {
    if (err) {
      return cb(err);
    }

    // Parse fucntion signature
    var funcSigMatch = code.match(patFuncStart);

    cb(null, {
      headKeys      : headKeys,
      body          : body,
      head          : head,
      name          : name,
      code          : code,
      dependencies  : dependencies,
      func_signature: funcSigMatch[0],
      func_name     : funcSigMatch[1],
      func_arguments: funcSigMatch[2].split(/,\s*/),
      commentBlocks : commentBlocks
    });
  });
};

PhpjsUtil.prototype.opener = function(name, cb) {
  return cb('Please override with a method that can translate a function-name to code in your environment');
};

PhpjsUtil.prototype.loadMultiple = function(names, cb) {
  var self = this;
  var paramsMultiple = {};
  var loaded = 0;
  for (var i in names) {
    var name = names[i];
    self.load(name, function(err, params) {
      if (err) {
        return cb(err);
      }

      paramsMultiple[params.name] = params;

      if (++loaded === names.length) {
        return cb(null, paramsMultiple);
      }
    });
  }
};

PhpjsUtil.prototype.load = function(name, cb) {
  var self = this;
  self.opener(name, function(err, code) {
    if (err) {
      return cb(err);
    }

    self.parse(name, code, function(err, params) {
      if (err) {
        return cb(err);
      }

      return cb(null, params);
    });
  });
};

PhpjsUtil.prototype.unique = function(array) {
  var a = array.concat();

  for (var i = 0; i < a.length; ++i) {
    for (var j = i + 1; j < a.length; ++j) {
      if (a[i] === a[j]) {
        a.splice(j--, 1);
      }
    }
  }

  return a;
};

PhpjsUtil.prototype.getRecursiveCode = function(params) {
  var self  = this;
  var codez = [];

  if ('name' in params) {
    codez.push(params.code);
    for (var d in params.dependencies) {
      codez = codez.concat(self.getRecursiveCode(params.dependencies[d]));
    }
  }

  codez = codez.reverse();

  return codez;
};

PhpjsUtil.prototype.test = function(params, cb) {
  var self  = this;
  var codez = [];


  self.loadMultiple(self.injectDependencies, function(err, paramsMultiple) {
    codez.unshift('phpjs = {}');
    for (var name in paramsMultiple) {
      codez.unshift(paramsMultiple[name].code);
    }

    var extracted = self.getRecursiveCode(params);
    codez = codez.concat(codez, extracted);

    codez.unshift('window.window' + ' = window;');
    for (var global in self.globals) {
      codez.unshift(global + ' = ' + self.globals[global] + ';');
    }

    // Load code
    // self. refers to own function
    // that. refers to phpjs
    // this. refers to phpjs
    var code = codez.join(';\n')
      .replace(/that\.([a-z_])/g, '$1')
      .replace(/this\.([a-z_])/g, '$1')
      .replace(/window\.setTimeout/g, 'setTimeout');

    // self.debug(code);
    eval(code);



    // Run each example
    for (var i in params.headKeys.example) {
      var test = {
        example: params.headKeys.example[i].join('\n'),
        number: i
      };

      if (!params.headKeys.returns[i] || !params.headKeys.returns[i].length) {
        cb('There is no return for example ' + i, test, params);
        continue;
      }

      // Needs an eval so types are cast properly, also, expected may
      // contain code
      eval('test.expected = ' + params.headKeys.returns[i].join('\n') + '');

      // Let's do something evil. Execute line by line (see date.js why)
      // We need test.reslult be the last result of the example code
      for (var j in params.headKeys.example[i]) {
        if (+j === params.headKeys.example[i].length - 1) {
          eval('test.result = ' + params.headKeys.example[i][j] + '');
        } else {
          eval(params.headKeys.example[i][j] + '');
        }
      }

      var jsonExpected = JSON.stringify(test.expected, undefined, 2);
      var jsonResult = JSON.stringify(test.result, undefined, 2);

      // We cannot compare using the JSON.stringify as object order is
      // not guaranteed
      if (!self.equal(test.expected, test.result)) {
        err = 'expected: \n' + jsonExpected + '\n\n' +
              'returned: \n' + jsonResult + '\n';
        cb(err, test, params);
        continue;
      }

      cb(null, test, params);
      continue;
    }
  });
};


//-----------------------------------------------------------------
//-----------------------------------------------------------------
//-----------------------------------------------------------------
//-----------------------------------------------------------------
//-----------------------------------------------------------------
//-----------------------------------------------------------------
//-----------------------------------------------------------------
//-----------------------------------------------------------------
//-----------------------------------------------------------------
//-----------------------------------------------------------------
//-----------------------------------------------------------------
//-----------------------------------------------------------------
//-----------------------------------------------------------------
function _phpjs_shared_bc() {
  // From: http://phpjs.org/functions
  // +   original by: lmeyrick (https://sourceforge.net/projects/bcmath-js/)
  // +   improved by: Brett Zamir (http://brett-zamir.me)
  // *     example 1: _phpjs_shared_bc();
  // *     returns 1: {}
  /**
   * BC Math Library for Javascript
   * Ported from the PHP5 bcmath extension source code,
   * which uses the libbcmath package...
   *    Copyright (C) 1991, 1992, 1993, 1994, 1997 Free Software Foundation, Inc.
   *    Copyright (C) 2000 Philip A. Nelson
   *     The Free Software Foundation, Inc.
   *     59 Temple Place, Suite 330
   *     Boston, MA 02111-1307 USA.
   *      e-mail:  philnelson@acm.org
   *     us-mail:  Philip A. Nelson
   *               Computer Science Department, 9062
   *               Western Washington University
   *               Bellingham, WA 98226-9062
   *
   * bcmath-js homepage:
   *
   * This code is covered under the LGPL licence, and can be used however you want :)
   * Be kind and share any decent code changes.
   */

  /**
   * Binary Calculator (BC) Arbitrary Precision Mathematics Lib v0.10  (LGPL)
   * Copy of libbcmath included in PHP5 src
   *
   * Note: this is just the shared library file and does not include the php-style functions.
   *       use bcmath{-min}.js for functions like bcadd, bcsub etc.
   *
   * Feel free to use how-ever you want, just email any bug-fixes/improvements to the sourceforge project:
   *
   *
   * Ported from the PHP5 bcmath extension source code,
   * which uses the libbcmath package...
   *    Copyright (C) 1991, 1992, 1993, 1994, 1997 Free Software Foundation, Inc.
   *    Copyright (C) 2000 Philip A. Nelson
   *     The Free Software Foundation, Inc.
   *     59 Temple Place, Suite 330
   *     Boston, MA 02111-1307 USA.
   *      e-mail:  philnelson@acm.org
   *     us-mail:  Philip A. Nelson
   *               Computer Science Department, 9062
   *               Western Washington University
   *               Bellingham, WA 98226-9062
   */

  var libbcmath = {
    PLUS: '+',
    MINUS: '-',
    BASE: 10,
    // must be 10 (for now)
    scale: 0,
    // default scale
    /**
     * Basic number structure
     */
    bc_num: function() {
      this.n_sign = null; // sign
      this.n_len = null; /* (int) The number of digits before the decimal point. */
      this.n_scale = null; /* (int) The number of digits after the decimal point. */
      //this.n_refs = null; /* (int) The number of pointers to this number. */
      //this.n_text = null; /* ?? Linked list for available list. */
      this.n_value = null; /* array as value, where 1.23 = [1,2,3] */
      this.toString = function() {
        var r, tmp;
        tmp = this.n_value.join('');

        // add minus sign (if applicable) then add the integer part
        r = ((this.n_sign == libbcmath.PLUS) ? '' : this.n_sign) + tmp.substr(0, this.n_len);

        // if decimal places, add a . and the decimal part
        if (this.n_scale > 0) {
          r += '.' + tmp.substr(this.n_len, this.n_scale);
        }
        return r;
      };
    },

    /**
     * Base add function
     *
     //  Here is the full add routine that takes care of negative numbers.
     //  N1 is added to N2 and the result placed into RESULT.  SCALE_MIN
     //  is the minimum scale for the result.
     *
     * @param {bc_num} n1
     * @param {bc_num} n2
     * @param {int} scale_min
     * @return bc_num
     */
    bc_add: function(n1, n2, scale_min) {
      var sum, cmp_res, res_scale;

      if (n1.n_sign === n2.n_sign) {
        sum = libbcmath._bc_do_add(n1, n2, scale_min);
        sum.n_sign = n1.n_sign;
      } else { /* subtraction must be done. */
        cmp_res = libbcmath._bc_do_compare(n1, n2, false, false); /* Compare magnitudes. */
        switch (cmp_res) {
          case -1:
            /* n1 is less than n2, subtract n1 from n2. */
            sum = libbcmath._bc_do_sub(n2, n1, scale_min);
            sum.n_sign = n2.n_sign;
            break;

          case 0:
            /* They are equal! return zero with the correct scale! */
            res_scale = libbcmath.MAX(scale_min, libbcmath.MAX(n1.n_scale, n2.n_scale));
            sum = libbcmath.bc_new_num(1, res_scale);
            libbcmath.memset(sum.n_value, 0, 0, res_scale + 1);
            break;

          case 1:
            /* n2 is less than n1, subtract n2 from n1. */
            sum = libbcmath._bc_do_sub(n1, n2, scale_min);
            sum.n_sign = n1.n_sign;
        }
      }
      return sum;
    },

    /**
     * This is the "user callable" routine to compare numbers N1 and N2.
     * @param {bc_num} n1
     * @param {bc_num} n2
     * @return int -1, 0, 1  (n1 < n2, ==, n1 > n2)
     */
    bc_compare: function(n1, n2) {
      return libbcmath._bc_do_compare(n1, n2, true, false);
    },

    _one_mult: function(num, n_ptr, size, digit, result, r_ptr) {
      var carry, value; // int
      var nptr, rptr; // int pointers
      if (digit === 0) {
        libbcmath.memset(result, 0, 0, size); //memset (result, 0, size);
      } else {
        if (digit == 1) {
          libbcmath.memcpy(result, r_ptr, num, n_ptr, size); //memcpy (result, num, size);
        } else { /*  Initialize */
          nptr = n_ptr + size - 1; //nptr = (unsigned char *) (num+size-1);
          rptr = r_ptr + size - 1; //rptr = (unsigned char *) (result+size-1);
          carry = 0;

          while (size-- > 0) {
            value = num[nptr--] * digit + carry; //value = *nptr-- * digit + carry;
            //result[rptr--] = libbcmath.cint(value % libbcmath.BASE); // @CHECK cint //*rptr-- = value % BASE;
            result[rptr--] = value % libbcmath.BASE; // @CHECK cint //*rptr-- = value % BASE;
            //carry = libbcmath.cint(value / libbcmath.BASE);   // @CHECK cint //carry = value / BASE;
            carry = Math.floor(value / libbcmath.BASE); // @CHECK cint //carry = value / BASE;
          }

          if (carry !== 0) {
            result[rptr] = carry;
          }
        }
      }
    },

    bc_divide: function(n1, n2, scale) {
      var quot; // bc_num return
      var qval; // bc_num
      var num1, num2; // string
      var ptr1, ptr2, n2ptr, qptr; // int pointers
      var scale1, val; // int
      var len1, len2, scale2, qdigits, extra, count; // int
      var qdig, qguess, borrow, carry; // int
      var mval; // string
      var zero; // char
      var norm; // int
      var ptrs; // return object from one_mul
      /* Test for divide by zero. (return failure) */
      if (libbcmath.bc_is_zero(n2)) {
        return -1;
      }

      /* Test for zero divide by anything (return zero) */
      if (libbcmath.bc_is_zero(n1)) {
        return libbcmath.bc_new_num(1, scale);
      }

      /* Test for n1 equals n2 (return 1 as n1 nor n2 are zero)
  if (libbcmath.bc_compare(n1, n2, libbcmath.MAX(n1.n_scale, n2.n_scale)) === 0) {
    quot=libbcmath.bc_new_num(1, scale);
    quot.n_value[0] = 1;
    return quot;
  }
  */

      /* Test for divide by 1.  If it is we must truncate. */
      // todo: check where scale > 0 too.. can't see why not (ie bc_is_zero - add bc_is_one function)
      if (n2.n_scale === 0) {
        if (n2.n_len === 1 && n2.n_value[0] === 1) {
          qval = libbcmath.bc_new_num(n1.n_len, scale); //qval = bc_new_num (n1->n_len, scale);
          qval.n_sign = (n1.n_sign == n2.n_sign ? libbcmath.PLUS : libbcmath.MINUS);
          libbcmath.memset(qval.n_value, n1.n_len, 0, scale); //memset (&qval->n_value[n1->n_len],0,scale);
          libbcmath.memcpy(qval.n_value, 0, n1.n_value, 0, n1.n_len + libbcmath.MIN(n1.n_scale, scale)); //memcpy (qval->n_value, n1->n_value, n1->n_len + MIN(n1->n_scale,scale));
          // can we return here? not in c src, but can't see why-not.
          // return qval;
        }
      }

      /* Set up the divide.  Move the decimal point on n1 by n2's scale.
   Remember, zeros on the end of num2 are wasted effort for dividing. */
      scale2 = n2.n_scale; //scale2 = n2->n_scale;
      n2ptr = n2.n_len + scale2 - 1; //n2ptr = (unsigned char *) n2.n_value+n2.n_len+scale2-1;
      while ((scale2 > 0) && (n2.n_value[n2ptr--] === 0)) {
        scale2--;
      }

      len1 = n1.n_len + scale2;
      scale1 = n1.n_scale - scale2;
      if (scale1 < scale) {
        extra = scale - scale1;
      } else {
        extra = 0;
      }

      num1 = libbcmath.safe_emalloc(1, n1.n_len + n1.n_scale, extra + 2); //num1 = (unsigned char *) safe_emalloc (1, n1.n_len+n1.n_scale, extra+2);
      if (num1 === null) {
        libbcmath.bc_out_of_memory();
      }
      libbcmath.memset(num1, 0, 0, n1.n_len + n1.n_scale + extra + 2); //memset (num1, 0, n1->n_len+n1->n_scale+extra+2);
      libbcmath.memcpy(num1, 1, n1.n_value, 0, n1.n_len + n1.n_scale); //memcpy (num1+1, n1.n_value, n1.n_len+n1.n_scale);
      len2 = n2.n_len + scale2; // len2 = n2->n_len + scale2;
      num2 = libbcmath.safe_emalloc(1, len2, 1); //num2 = (unsigned char *) safe_emalloc (1, len2, 1);
      if (num2 === null) {
        libbcmath.bc_out_of_memory();
      }
      libbcmath.memcpy(num2, 0, n2.n_value, 0, len2); //memcpy (num2, n2.n_value, len2);
      num2[len2] = 0; // *(num2+len2) = 0;
      n2ptr = 0; //n2ptr = num2;
      while (num2[n2ptr] === 0) { // while (*n2ptr == 0)
        n2ptr++;
        len2--;
      }

      /* Calculate the number of quotient digits. */
      if (len2 > len1 + scale) {
        qdigits = scale + 1;
        zero = true;
      } else {
        zero = false;
        if (len2 > len1) {
          qdigits = scale + 1; /* One for the zero integer part. */
        } else {
          qdigits = len1 - len2 + scale + 1;
        }
      }

      /* Allocate and zero the storage for the quotient. */
      qval = libbcmath.bc_new_num(qdigits - scale, scale); //qval = bc_new_num (qdigits-scale,scale);
      libbcmath.memset(qval.n_value, 0, 0, qdigits); //memset (qval->n_value, 0, qdigits);
      /* Allocate storage for the temporary storage mval. */
      mval = libbcmath.safe_emalloc(1, len2, 1); //mval = (unsigned char *) safe_emalloc (1, len2, 1);
      if (mval === null) {
        libbcmath.bc_out_of_memory();
      }

      /* Now for the full divide algorithm. */
      if (!zero) { /* Normalize */
        //norm = libbcmath.cint(10 / (libbcmath.cint(n2.n_value[n2ptr]) + 1)); //norm =  10 / ((int)*n2ptr + 1);
        norm = Math.floor(10 / (n2.n_value[n2ptr] + 1)); //norm =  10 / ((int)*n2ptr + 1);
        if (norm != 1) {
          libbcmath._one_mult(num1, 0, len1 + scale1 + extra + 1, norm, num1, 0); //libbcmath._one_mult(num1, len1+scale1+extra+1, norm, num1);
          libbcmath._one_mult(n2.n_value, n2ptr, len2, norm, n2.n_value, n2ptr); //libbcmath._one_mult(n2ptr, len2, norm, n2ptr);
          // @CHECK Is the pointer affected by the call? if so, maybe need to adjust points on return?
        }

        /* Initialize divide loop. */
        qdig = 0;
        if (len2 > len1) {
          qptr = len2 - len1; //qptr = (unsigned char *) qval.n_value+len2-len1;
        } else {
          qptr = 0; //qptr = (unsigned char *) qval.n_value;
        }

        /* Loop */
        while (qdig <= len1 + scale - len2) { /* Calculate the quotient digit guess. */
          if (n2.n_value[n2ptr] == num1[qdig]) {
            qguess = 9;
          } else {
            qguess = Math.floor((num1[qdig] * 10 + num1[qdig + 1]) / n2.n_value[n2ptr]);
          } /* Test qguess. */

          if (n2.n_value[n2ptr + 1] * qguess > (num1[qdig] * 10 + num1[qdig + 1] - n2.n_value[n2ptr] * qguess) * 10 + num1[qdig + 2]) { //if (n2ptr[1]*qguess > (num1[qdig]*10 + num1[qdig+1] - *n2ptr*qguess)*10 + num1[qdig+2]) {
            qguess--; /* And again. */
            if (n2.n_value[n2ptr + 1] * qguess > (num1[qdig] * 10 + num1[qdig + 1] - n2.n_value[n2ptr] * qguess) * 10 + num1[qdig + 2]) { //if (n2ptr[1]*qguess > (num1[qdig]*10 + num1[qdig+1] - *n2ptr*qguess)*10 + num1[qdig+2])
              qguess--;
            }
          }

          /* Multiply and subtract. */
          borrow = 0;
          if (qguess !== 0) {
            mval[0] = 0; //*mval = 0; // @CHECK is this to fix ptr2 < 0?
            libbcmath._one_mult(n2.n_value, n2ptr, len2, qguess, mval, 1); //_one_mult (n2ptr, len2, qguess, mval+1); // @CHECK
            ptr1 = qdig + len2; //(unsigned char *) num1+qdig+len2;
            ptr2 = len2; //(unsigned char *) mval+len2;
            // @CHECK: Does a negative pointer return null?
            //         ptr2 can be < 0 here as ptr1 = len2, thus count < len2+1 will always fail ?
            for (count = 0; count < len2 + 1; count++) {
              if (ptr2 < 0) {
                //val = libbcmath.cint(num1[ptr1]) - 0 - borrow;    //val = (int) *ptr1 - (int) *ptr2-- - borrow;
                val = num1[ptr1] - 0 - borrow; //val = (int) *ptr1 - (int) *ptr2-- - borrow;
              } else {
                //val = libbcmath.cint(num1[ptr1]) - libbcmath.cint(mval[ptr2--]) - borrow;    //val = (int) *ptr1 - (int) *ptr2-- - borrow;
                val = num1[ptr1] - mval[ptr2--] - borrow; //val = (int) *ptr1 - (int) *ptr2-- - borrow;
              }
              if (val < 0) {
                val += 10;
                borrow = 1;
              } else {
                borrow = 0;
              }
              num1[ptr1--] = val;
            }
          }

          /* Test for negative result. */
          if (borrow == 1) {
            qguess--;
            ptr1 = qdig + len2; //(unsigned char *) num1+qdig+len2;
            ptr2 = len2 - 1; //(unsigned char *) n2ptr+len2-1;
            carry = 0;
            for (count = 0; count < len2; count++) {
              if (ptr2 < 0) {
                //val = libbcmath.cint(num1[ptr1]) + 0 + carry; //val = (int) *ptr1 + (int) *ptr2-- + carry;
                val = num1[ptr1] + 0 + carry; //val = (int) *ptr1 + (int) *ptr2-- + carry;
              } else {
                //val = libbcmath.cint(num1[ptr1]) + libbcmath.cint(n2.n_value[ptr2--]) + carry; //val = (int) *ptr1 + (int) *ptr2-- + carry;
                val = num1[ptr1] + n2.n_value[ptr2--] + carry; //val = (int) *ptr1 + (int) *ptr2-- + carry;
              }
              if (val > 9) {
                val -= 10;
                carry = 1;
              } else {
                carry = 0;
              }
              num1[ptr1--] = val; //*ptr1-- = val;
            }
            if (carry == 1) {
              //num1[ptr1] = libbcmath.cint((num1[ptr1] + 1) % 10);  // *ptr1 = (*ptr1 + 1) % 10; // @CHECK
              num1[ptr1] = (num1[ptr1] + 1) % 10; // *ptr1 = (*ptr1 + 1) % 10; // @CHECK
            }
          }

          /* We now know the quotient digit. */
          qval.n_value[qptr++] = qguess; //*qptr++ =  qguess;
          qdig++;
        }
      }

      /* Clean up and return the number. */
      qval.n_sign = (n1.n_sign == n2.n_sign ? libbcmath.PLUS : libbcmath.MINUS);
      if (libbcmath.bc_is_zero(qval)) {
        qval.n_sign = libbcmath.PLUS;
      }
      libbcmath._bc_rm_leading_zeros(qval);

      return qval;

      //return 0;    /* Everything is OK. */
    },



    MUL_BASE_DIGITS: 80,
    MUL_SMALL_DIGITS: (this.MUL_BASE_DIGITS / 4),
    //#define MUL_SMALL_DIGITS mul_base_digits/4

    /* The multiply routine.  N2 times N1 is put int PROD with the scale of
   the result being MIN(N2 scale+N1 scale, MAX (SCALE, N2 scale, N1 scale)).
   */
    /**
     * @param n1 bc_num
     * @param n2 bc_num
     * @param scale [int] optional
     */
    bc_multiply: function(n1, n2, scale) {
      var pval; // bc_num
      var len1, len2; // int
      var full_scale, prod_scale; // int
      // Initialize things.
      len1 = n1.n_len + n1.n_scale;
      len2 = n2.n_len + n2.n_scale;
      full_scale = n1.n_scale + n2.n_scale;
      prod_scale = libbcmath.MIN(full_scale, libbcmath.MAX(scale, libbcmath.MAX(n1.n_scale, n2.n_scale)));

      //pval = libbcmath.bc_init_num(); // allow pass by ref
      // Do the multiply
      pval = libbcmath._bc_rec_mul(n1, len1, n2, len2, full_scale);

      // Assign to prod and clean up the number.
      pval.n_sign = (n1.n_sign == n2.n_sign ? libbcmath.PLUS : libbcmath.MINUS);
      //pval.n_value = pval.n_ptr; // @FIX
      pval.n_len = len2 + len1 + 1 - full_scale;
      pval.n_scale = prod_scale;
      libbcmath._bc_rm_leading_zeros(pval);
      if (libbcmath.bc_is_zero(pval)) {
        pval.n_sign = libbcmath.PLUS;
      }
      //bc_free_num (prod);
      return pval;
    },

    new_sub_num: function(length, scale, value) {
      var temp = new libbcmath.bc_num();
      temp.n_sign = libbcmath.PLUS;
      temp.n_len = length;
      temp.n_scale = scale;
      temp.n_value = value;
      return temp;
    },

    _bc_simp_mul: function(n1, n1len, n2, n2len, full_scale) {
      var prod; // bc_num
      var n1ptr, n2ptr, pvptr; // char *n1ptr, *n2ptr, *pvptr;
      var n1end, n2end; //char *n1end, *n2end;        /* To the end of n1 and n2. */
      var indx, sum, prodlen; //int indx, sum, prodlen;
      prodlen = n1len + n2len + 1;

      prod = libbcmath.bc_new_num(prodlen, 0);

      n1end = n1len - 1; //(char *) (n1->n_value + n1len - 1);
      n2end = n2len - 1; //(char *) (n2->n_value + n2len - 1);
      pvptr = prodlen - 1; //(char *) ((*prod)->n_value + prodlen - 1);
      sum = 0;

      // Here is the loop...
      for (indx = 0; indx < prodlen - 1; indx++) {
        n1ptr = n1end - libbcmath.MAX(0, indx - n2len + 1); //(char *) (n1end - MAX(0, indx-n2len+1));
        n2ptr = n2end - libbcmath.MIN(indx, n2len - 1); //(char *) (n2end - MIN(indx, n2len-1));
        while ((n1ptr >= 0) && (n2ptr <= n2end)) {
          sum += n1.n_value[n1ptr--] * n2.n_value[n2ptr++]; //sum += *n1ptr-- * *n2ptr++;
        }
        prod.n_value[pvptr--] = Math.floor(sum % libbcmath.BASE); //*pvptr-- = sum % BASE;
        sum = Math.floor(sum / libbcmath.BASE); //sum = sum / BASE;
      }
      prod.n_value[pvptr] = sum; //*pvptr = sum;
      return prod;
    },


    /* A special adder/subtractor for the recursive divide and conquer
       multiply algorithm.  Note: if sub is called, accum must
       be larger that what is being subtracted.  Also, accum and val
       must have n_scale = 0.  (e.g. they must look like integers. *) */
    _bc_shift_addsub: function(accum, val, shift, sub) {
      var accp, valp; //signed char *accp, *valp;
      var count, carry; //int  count, carry;
      count = val.n_len;
      if (val.n_value[0] === 0) {
        count--;
      }

      //assert (accum->n_len+accum->n_scale >= shift+count);
      if (accum.n_len + accum.n_scale < shift + count) {
        throw new Error('len + scale < shift + count'); // ?? I think that's what assert does :)
      }


      // Set up pointers and others
      accp = accum.n_len + accum.n_scale - shift - 1; // (signed char *)(accum->n_value + accum->n_len + accum->n_scale - shift - 1);
      valp = val.n_len = 1; //(signed char *)(val->n_value + val->n_len - 1);
      carry = 0;
      if (sub) {
        // Subtraction, carry is really borrow.
        while (count--) {
          accum.n_value[accp] -= val.n_value[valp--] + carry; //*accp -= *valp-- + carry;
          if (accum.n_value[accp] < 0) { //if (*accp < 0)
            carry = 1;
            accum.n_value[accp--] += libbcmath.BASE; //*accp-- += BASE;
          } else {
            carry = 0;
            accp--;
          }
        }
        while (carry) {
          accum.n_value[accp] -= carry; //*accp -= carry;
          if (accum.n_value[accp] < 0) { //if (*accp < 0)
            accum.n_value[accp--] += libbcmath.BASE; //    *accp-- += BASE;
          } else {
            carry = 0;
          }
        }
      } else {
        // Addition
        while (count--) {
          accum.n_value[accp] += val.n_value[valp--] + carry; //*accp += *valp-- + carry;
          if (accum.n_value[accp] > (libbcmath.BASE - 1)) { //if (*accp > (BASE-1))
            carry = 1;
            accum.n_value[accp--] -= libbcmath.BASE; //*accp-- -= BASE;
          } else {
            carry = 0;
            accp--;
          }
        }
        while (carry) {
          accum.n_value[accp] += carry; //*accp += carry;
          if (accum.n_value[accp] > (libbcmath.BASE - 1)) { //if (*accp > (BASE-1))
            accum.n_value[accp--] -= libbcmath.BASE; //*accp-- -= BASE;
          } else {
            carry = 0;
          }
        }
      }
      return true; // accum is the pass-by-reference return
    },

    /* Recursive divide and conquer multiply algorithm.
       original by
       Let u = u0 + u1*(b^n)
       Let v = v0 + v1*(b^n)
       Then uv = (B^2n+B^n)*u1*v1 + B^n*(u1-u0)*(v0-v1) + (B^n+1)*u0*v0

       B is the base of storage, number of digits in u1,u0 close to equal.
    */
    _bc_rec_mul: function(u, ulen, v, vlen, full_scale) {
      var prod; // @return
      var u0, u1, v0, v1; //bc_num
      var u0len, v0len; //int
      var m1, m2, m3, d1, d2; //bc_num
      var n, prodlen, m1zero; // int
      var d1len, d2len; // int
      // Base case?
      if ((ulen + vlen) < libbcmath.MUL_BASE_DIGITS || ulen < libbcmath.MUL_SMALL_DIGITS || vlen < libbcmath.MUL_SMALL_DIGITS) {
        return libbcmath._bc_simp_mul(u, ulen, v, vlen, full_scale);
      }

      // Calculate n -- the u and v split point in digits.
      n = Math.floor((libbcmath.MAX(ulen, vlen) + 1) / 2);

      // Split u and v.
      if (ulen < n) {
        u1 = libbcmath.bc_init_num(); //u1 = bc_copy_num (BCG(_zero_));
        u0 = libbcmath.new_sub_num(ulen, 0, u.n_value);
      } else {
        u1 = libbcmath.new_sub_num(ulen - n, 0, u.n_value);
        u0 = libbcmath.new_sub_num(n, 0, u.n_value + ulen - n);
      }
      if (vlen < n) {
        v1 = libbcmath.bc_init_num(); //bc_copy_num (BCG(_zero_));
        v0 = libbcmath.new_sub_num(vlen, 0, v.n_value);
      } else {
        v1 = libbcmath.new_sub_num(vlen - n, 0, v.n_value);
        v0 = libbcmath.new_sub_num(n, 0, v.n_value + vlen - n);
      }
      libbcmath._bc_rm_leading_zeros(u1);
      libbcmath._bc_rm_leading_zeros(u0);
      u0len = u0.n_len;
      libbcmath._bc_rm_leading_zeros(v1);
      libbcmath._bc_rm_leading_zeros(v0);
      v0len = v0.n_len;

      m1zero = libbcmath.bc_is_zero(u1) || libbcmath.bc_is_zero(v1);

      // Calculate sub results ...
      d1 = libbcmath.bc_init_num(); // needed?
      d2 = libbcmath.bc_init_num(); // needed?
      d1 = libbcmath.bc_sub(u1, u0, 0);
      d1len = d1.n_len;

      d2 = libbcmath.bc_sub(v0, v1, 0);
      d2len = d2.n_len;

      // Do recursive multiplies and shifted adds.
      if (m1zero) {
        m1 = libbcmath.bc_init_num(); //bc_copy_num (BCG(_zero_));
      } else {
        //m1 = libbcmath.bc_init_num(); //allow pass-by-ref
        m1 = libbcmath._bc_rec_mul(u1, u1.n_len, v1, v1.n_len, 0);
      }
      if (libbcmath.bc_is_zero(d1) || libbcmath.bc_is_zero(d2)) {
        m2 = libbcmath.bc_init_num(); //bc_copy_num (BCG(_zero_));
      } else {
        //m2 = libbcmath.bc_init_num(); //allow pass-by-ref
        m2 = libbcmath._bc_rec_mul(d1, d1len, d2, d2len, 0);
      }

      if (libbcmath.bc_is_zero(u0) || libbcmath.bc_is_zero(v0)) {
        m3 = libbcmath.bc_init_num(); //bc_copy_num (BCG(_zero_));
      } else {
        //m3 = libbcmath.bc_init_num(); //allow pass-by-ref
        m3 = libbcmath._bc_rec_mul(u0, u0.n_len, v0, v0.n_len, 0);
      }

      // Initialize product
      prodlen = ulen + vlen + 1;
      prod = libbcmath.bc_new_num(prodlen, 0);

      if (!m1zero) {
        libbcmath._bc_shift_addsub(prod, m1, 2 * n, 0);
        libbcmath._bc_shift_addsub(prod, m1, n, 0);
      }
      libbcmath._bc_shift_addsub(prod, m3, n, 0);
      libbcmath._bc_shift_addsub(prod, m3, 0, 0);
      libbcmath._bc_shift_addsub(prod, m2, n, d1.n_sign != d2.n_sign);

      return prod;
      // Now clean up!
      //bc_free_num (&u1);
      //bc_free_num (&u0);
      //bc_free_num (&v1);
      //bc_free_num (&m1);
      //bc_free_num (&v0);
      //bc_free_num (&m2);
      //bc_free_num (&m3);
      //bc_free_num (&d1);
      //bc_free_num (&d2);
    },


    /**
     *
     * @param {bc_num} n1
     * @param {bc_num} n2
     * @param {boolean} use_sign
     * @param {boolean} ignore_last
     * @return -1, 0, 1 (see bc_compare)
     */
    _bc_do_compare: function(n1, n2, use_sign, ignore_last) {
      var n1ptr, n2ptr; // int
      var count; // int
      /* First, compare signs. */
      if (use_sign && (n1.n_sign != n2.n_sign)) {
        if (n1.n_sign == libbcmath.PLUS) {
          return (1); /* Positive N1 > Negative N2 */
        } else {
          return (-1); /* Negative N1 < Positive N1 */
        }
      }

      /* Now compare the magnitude. */
      if (n1.n_len != n2.n_len) {
        if (n1.n_len > n2.n_len) { /* Magnitude of n1 > n2. */
          if (!use_sign || (n1.n_sign == libbcmath.PLUS)) {
            return (1);
          } else {
            return (-1);
          }
        } else { /* Magnitude of n1 < n2. */
          if (!use_sign || (n1.n_sign == libbcmath.PLUS)) {
            return (-1);
          } else {
            return (1);
          }
        }
      }

      /* If we get here, they have the same number of integer digits.
     check the integer part and the equal length part of the fraction. */
      count = n1.n_len + Math.min(n1.n_scale, n2.n_scale);
      n1ptr = 0;
      n2ptr = 0;

      while ((count > 0) && (n1.n_value[n1ptr] == n2.n_value[n2ptr])) {
        n1ptr++;
        n2ptr++;
        count--;
      }

      if (ignore_last && (count == 1) && (n1.n_scale == n2.n_scale)) {
        return (0);
      }

      if (count !== 0) {
        if (n1.n_value[n1ptr] > n2.n_value[n2ptr]) { /* Magnitude of n1 > n2. */
          if (!use_sign || n1.n_sign == libbcmath.PLUS) {
            return (1);
          } else {
            return (-1);
          }
        } else { /* Magnitude of n1 < n2. */
          if (!use_sign || n1.n_sign == libbcmath.PLUS) {
            return (-1);
          } else {
            return (1);
          }
        }
      }

      /* They are equal up to the last part of the equal part of the fraction. */
      if (n1.n_scale != n2.n_scale) {
        if (n1.n_scale > n2.n_scale) {
          for (count = (n1.n_scale - n2.n_scale); count > 0; count--) {
            if (n1.n_value[n1ptr++] !== 0) { /* Magnitude of n1 > n2. */
              if (!use_sign || n1.n_sign == libbcmath.PLUS) {
                return (1);
              } else {
                return (-1);
              }
            }
          }
        } else {
          for (count = (n2.n_scale - n1.n_scale); count > 0; count--) {
            if (n2.n_value[n2ptr++] !== 0) { /* Magnitude of n1 < n2. */
              if (!use_sign || n1.n_sign == libbcmath.PLUS) {
                return (-1);
              } else {
                return (1);
              }
            }
          }
        }
      }

      /* They must be equal! */
      return (0);
    },



    /* Here is the full subtract routine that takes care of negative numbers.
   N2 is subtracted from N1 and the result placed in RESULT.  SCALE_MIN
   is the minimum scale for the result. */
    bc_sub: function(n1, n2, scale_min) {
      var diff; // bc_num
      var cmp_res, res_scale; //int
      if (n1.n_sign != n2.n_sign) {
        diff = libbcmath._bc_do_add(n1, n2, scale_min);
        diff.n_sign = n1.n_sign;
      } else { /* subtraction must be done. */
        /* Compare magnitudes. */
        cmp_res = libbcmath._bc_do_compare(n1, n2, false, false);
        switch (cmp_res) {
          case -1:
            /* n1 is less than n2, subtract n1 from n2. */
            diff = libbcmath._bc_do_sub(n2, n1, scale_min);
            diff.n_sign = (n2.n_sign == libbcmath.PLUS ? libbcmath.MINUS : libbcmath.PLUS);
            break;
          case 0:
            /* They are equal! return zero! */
            res_scale = libbcmath.MAX(scale_min, libbcmath.MAX(n1.n_scale, n2.n_scale));
            diff = libbcmath.bc_new_num(1, res_scale);
            libbcmath.memset(diff.n_value, 0, 0, res_scale + 1);
            break;
          case 1:
            /* n2 is less than n1, subtract n2 from n1. */
            diff = libbcmath._bc_do_sub(n1, n2, scale_min);
            diff.n_sign = n1.n_sign;
            break;
        }
      }

      /* Clean up and return. */
      //bc_free_num (result);
      //*result = diff;
      return diff;
    },


    _bc_do_add: function(n1, n2, scale_min) {
      var sum; // bc_num
      var sum_scale, sum_digits; // int
      var n1ptr, n2ptr, sumptr; // int
      var carry, n1bytes, n2bytes; // int
      var tmp; // int

      // Prepare sum.
      sum_scale = libbcmath.MAX(n1.n_scale, n2.n_scale);
      sum_digits = libbcmath.MAX(n1.n_len, n2.n_len) + 1;
      sum = libbcmath.bc_new_num(sum_digits, libbcmath.MAX(sum_scale, scale_min));


      /* Not needed?
    if (scale_min > sum_scale) {
      sumptr = (char *) (sum->n_value + sum_scale + sum_digits);
      for (count = scale_min - sum_scale; count > 0; count--) {
        *sumptr++ = 0;
      }
    }
    */

      // Start with the fraction part.  Initialize the pointers.
      n1bytes = n1.n_scale;
      n2bytes = n2.n_scale;
      n1ptr = (n1.n_len + n1bytes - 1);
      n2ptr = (n2.n_len + n2bytes - 1);
      sumptr = (sum_scale + sum_digits - 1);

      // Add the fraction part.  First copy the longer fraction (ie when adding 1.2345 to 1 we know .2345 is correct already) .
      if (n1bytes != n2bytes) {
        if (n1bytes > n2bytes) {
          // n1 has more dp then n2
          while (n1bytes > n2bytes) {
            sum.n_value[sumptr--] = n1.n_value[n1ptr--];
            // *sumptr-- = *n1ptr--;
            n1bytes--;
          }
        } else {
          // n2 has more dp then n1
          while (n2bytes > n1bytes) {
            sum.n_value[sumptr--] = n2.n_value[n2ptr--];
            // *sumptr-- = *n2ptr--;
            n2bytes--;
          }
        }
      }

      // Now add the remaining fraction part and equal size integer parts.
      n1bytes += n1.n_len;
      n2bytes += n2.n_len;
      carry = 0;
      while ((n1bytes > 0) && (n2bytes > 0)) {

        // add the two numbers together
        tmp = n1.n_value[n1ptr--] + n2.n_value[n2ptr--] + carry;
        // *sumptr = *n1ptr-- + *n2ptr-- + carry;
        // check if they are >= 10 (impossible to be more then 18)
        if (tmp >= libbcmath.BASE) {
          carry = 1;
          tmp -= libbcmath.BASE; // yep, subtract 10, add a carry
        } else {
          carry = 0;
        }
        sum.n_value[sumptr] = tmp;
        sumptr--;
        n1bytes--;
        n2bytes--;
      }

      // Now add carry the [rest of the] longer integer part.
      if (n1bytes === 0) {
        // n2 is a bigger number then n1
        while (n2bytes-- > 0) {
          tmp = n2.n_value[n2ptr--] + carry;
          // *sumptr = *n2ptr-- + carry;
          if (tmp >= libbcmath.BASE) {
            carry = 1;
            tmp -= libbcmath.BASE;
          } else {
            carry = 0;
          }
          sum.n_value[sumptr--] = tmp;
        }
      } else {
        // n1 is bigger then n2..
        while (n1bytes-- > 0) {
          tmp = n1.n_value[n1ptr--] + carry;
          // *sumptr = *n1ptr-- + carry;
          if (tmp >= libbcmath.BASE) {
            carry = 1;
            tmp -= libbcmath.BASE;
          } else {
            carry = 0;
          }
          sum.n_value[sumptr--] = tmp;
        }
      }

      // Set final carry.
      if (carry == 1) {
        sum.n_value[sumptr] += 1;
        // *sumptr += 1;
      }

      // Adjust sum and return.
      libbcmath._bc_rm_leading_zeros(sum);
      return sum;
    },

    /**
     * Perform a subtraction
     *
     // Perform subtraction: N2 is subtracted from N1 and the value is
     //  returned.  The signs of N1 and N2 are ignored.  Also, N1 is
     //  assumed to be larger than N2.  SCALE_MIN is the minimum scale
     //  of the result.
     *
     * Basic school maths says to subtract 2 numbers..
     * 1. make them the same length, the decimal places, and the integer part
     * 2. start from the right and subtract the two numbers from each other
     * 3. if the sum of the 2 numbers < 0, carry -1 to the next set and add 10 (ie 18 > carry 1 becomes 8). thus 0.9 + 0.9 = 1.8
     *
     * @param {bc_num} n1
     * @param {bc_num} n2
     * @param {int} scale_min
     * @return bc_num
     */
    _bc_do_sub: function(n1, n2, scale_min) {
      var diff; //bc_num
      var diff_scale, diff_len; // int
      var min_scale, min_len; // int
      var n1ptr, n2ptr, diffptr; // int
      var borrow, count, val; // int
      // Allocate temporary storage.
      diff_len = libbcmath.MAX(n1.n_len, n2.n_len);
      diff_scale = libbcmath.MAX(n1.n_scale, n2.n_scale);
      min_len = libbcmath.MIN(n1.n_len, n2.n_len);
      min_scale = libbcmath.MIN(n1.n_scale, n2.n_scale);
      diff = libbcmath.bc_new_num(diff_len, libbcmath.MAX(diff_scale, scale_min));

      /* Not needed?
    // Zero extra digits made by scale_min.
    if (scale_min > diff_scale) {
      diffptr = (char *) (diff->n_value + diff_len + diff_scale);
      for (count = scale_min - diff_scale; count > 0; count--) {
        *diffptr++ = 0;
      }
    }
    */

      // Initialize the subtract.
      n1ptr = (n1.n_len + n1.n_scale - 1);
      n2ptr = (n2.n_len + n2.n_scale - 1);
      diffptr = (diff_len + diff_scale - 1);

      // Subtract the numbers.
      borrow = 0;

      // Take care of the longer scaled number.
      if (n1.n_scale != min_scale) {
        // n1 has the longer scale
        for (count = n1.n_scale - min_scale; count > 0; count--) {
          diff.n_value[diffptr--] = n1.n_value[n1ptr--];
          // *diffptr-- = *n1ptr--;
        }
      } else {
        // n2 has the longer scale
        for (count = n2.n_scale - min_scale; count > 0; count--) {
          val = 0 - n2.n_value[n2ptr--] - borrow;
          //val = - *n2ptr-- - borrow;
          if (val < 0) {
            val += libbcmath.BASE;
            borrow = 1;
          } else {
            borrow = 0;
          }
          diff.n_value[diffptr--] = val;
          //*diffptr-- = val;
        }
      }

      // Now do the equal length scale and integer parts.
      for (count = 0; count < min_len + min_scale; count++) {
        val = n1.n_value[n1ptr--] - n2.n_value[n2ptr--] - borrow;
        //val = *n1ptr-- - *n2ptr-- - borrow;
        if (val < 0) {
          val += libbcmath.BASE;
          borrow = 1;
        } else {
          borrow = 0;
        }
        diff.n_value[diffptr--] = val;
        //*diffptr-- = val;
      }

      // If n1 has more digits then n2, we now do that subtract.
      if (diff_len != min_len) {
        for (count = diff_len - min_len; count > 0; count--) {
          val = n1.n_value[n1ptr--] - borrow;
          // val = *n1ptr-- - borrow;
          if (val < 0) {
            val += libbcmath.BASE;
            borrow = 1;
          } else {
            borrow = 0;
          }
          diff.n_value[diffptr--] = val;
        }
      }

      // Clean up and return.
      libbcmath._bc_rm_leading_zeros(diff);
      return diff;
    },

    /**
     *
     * @param {int} length
     * @param {int} scale
     * @return bc_num
     */
    bc_new_num: function(length, scale) {
      var temp; // bc_num
      temp = new libbcmath.bc_num();
      temp.n_sign = libbcmath.PLUS;
      temp.n_len = length;
      temp.n_scale = scale;
      temp.n_value = libbcmath.safe_emalloc(1, length + scale, 0);
      libbcmath.memset(temp.n_value, 0, 0, length + scale);
      return temp;
    },

    safe_emalloc: function(size, len, extra) {
      return Array((size * len) + extra);
    },

    /**
     * Create a new number
     */
    bc_init_num: function() {
      return new libbcmath.bc_new_num(1, 0);

    },

    _bc_rm_leading_zeros: function(num) { /* We can move n_value to point to the first non zero digit! */
      while ((num.n_value[0] === 0) && (num.n_len > 1)) {
        num.n_value.shift();
        num.n_len--;
      }
    },

    /**
     * Convert to bc_num detecting scale
     */
    php_str2num: function(str) {
      var p;
      p = str.indexOf('.');
      if (p == -1) {
        return libbcmath.bc_str2num(str, 0);
      } else {
        return libbcmath.bc_str2num(str, (str.length - p));
      }

    },

    CH_VAL: function(c) {
      return c - '0'; //??
    },

    BCD_CHAR: function(d) {
      return d + '0'; // ??
    },

    isdigit: function(c) {
      return (isNaN(parseInt(c, 10)) ? false : true);
    },

    bc_str2num: function(str_in, scale) {
      var str, num, ptr, digits, strscale, zero_int, nptr;
      // remove any non-expected characters
      /* Check for valid number and count digits. */

      str = str_in.split(''); // convert to array
      ptr = 0; // str
      digits = 0;
      strscale = 0;
      zero_int = false;
      if ((str[ptr] === '+') || (str[ptr] === '-')) {
        ptr++; /* Sign */
      }
      while (str[ptr] === '0') {
        ptr++; /* Skip leading zeros. */
      }
      //while (libbcmath.isdigit(str[ptr])) {
      while ((str[ptr]) % 1 === 0) { //libbcmath.isdigit(str[ptr])) {
        ptr++;
        digits++; /* digits */
      }

      if (str[ptr] === '.') {
        ptr++; /* decimal point */
      }
      //while (libbcmath.isdigit(str[ptr])) {
      while ((str[ptr]) % 1 === 0) { //libbcmath.isdigit(str[ptr])) {
        ptr++;
        strscale++; /* digits */
      }

      if ((str[ptr]) || (digits + strscale === 0)) {
        // invalid number, return 0
        return libbcmath.bc_init_num();
        //*num = bc_copy_num (BCG(_zero_));
      }

      /* Adjust numbers and allocate storage and initialize fields. */
      strscale = libbcmath.MIN(strscale, scale);
      if (digits === 0) {
        zero_int = true;
        digits = 1;
      }

      num = libbcmath.bc_new_num(digits, strscale);

      /* Build the whole number. */
      ptr = 0; // str
      if (str[ptr] === '-') {
        num.n_sign = libbcmath.MINUS;
        //(*num)->n_sign = MINUS;
        ptr++;
      } else {
        num.n_sign = libbcmath.PLUS;
        //(*num)->n_sign = PLUS;
        if (str[ptr] === '+') {
          ptr++;
        }
      }
      while (str[ptr] === '0') {
        ptr++; /* Skip leading zeros. */
      }

      nptr = 0; //(*num)->n_value;
      if (zero_int) {
        num.n_value[nptr++] = 0;
        digits = 0;
      }
      for (; digits > 0; digits--) {
        num.n_value[nptr++] = libbcmath.CH_VAL(str[ptr++]);
        //*nptr++ = CH_VAL(*ptr++);
      }

      /* Build the fractional part. */
      if (strscale > 0) {
        ptr++; /* skip the decimal point! */
        for (; strscale > 0; strscale--) {
          num.n_value[nptr++] = libbcmath.CH_VAL(str[ptr++]);
        }
      }

      return num;
    },

    cint: function(v) {
      if (typeof v === 'undefined') {
        v = 0;
      }
      var x = parseInt(v, 10);
      if (isNaN(x)) {
        x = 0;
      }
      return x;
    },

    /**
     * Basic min function
     * @param {int} a
     * @param {int} b
     */
    MIN: function(a, b) {
      return ((a > b) ? b : a);
    },

    /**
     * Basic max function
     * @param {int} a
     * @param {int} b
     */
    MAX: function(a, b) {
      return ((a > b) ? a : b);
    },

    /**
     * Basic odd function
     * @param {int} a
     */
    ODD: function(a) {
      return (a & 1);
    },

    /**
     * replicate c function
     * @param {array} r     return (by reference)
     * @param {int} ptr
     * @param {string} chr    char to fill
     * @param {int} len       length to fill
     */
    memset: function(r, ptr, chr, len) {
      var i;
      for (i = 0; i < len; i++) {
        r[ptr + i] = chr;
      }
    },

    /**
     * Replacement c function
     * Obviously can't work like c does, so we've added an "offset" param so you could do memcpy(dest+1, src, len) as memcpy(dest, 1, src, len)
     * Also only works on arrays
     */
    memcpy: function(dest, ptr, src, srcptr, len) {
      var i;
      for (i = 0; i < len; i++) {
        dest[ptr + i] = src[srcptr + i];
      }
      return true;
    },


    /**
     * Determine if the number specified is zero or not
     * @param {bc_num} num    number to check
     * @return boolean      true when zero, false when not zero.
     */
    bc_is_zero: function(num) {
      var count; // int
      var nptr; // int
      /* Quick check. */
      //if (num == BCG(_zero_)) return TRUE;
      /* Initialize */
      count = num.n_len + num.n_scale;
      nptr = 0; //num->n_value;
      /* The check */
      while ((count > 0) && (num.n_value[nptr++] === 0)) {
        count--;
      }

      if (count !== 0) {
        return false;
      } else {
        return true;
      }
    },

    bc_out_of_memory: function() {
      throw new Error('(BC) Out of memory');
    }
  };
  return libbcmath;
}


//-----------------------------------------------------------------
//-----------------------------------------------------------------
//-----------------------------------------------------------------
//-----------------------------------------------------------------
//-----------------------------------------------------------------
//-----------------------------------------------------------------
//-----------------------------------------------------------------
//-----------------------------------------------------------------
//-----------------------------------------------------------------
//-----------------------------------------------------------------
//-----------------------------------------------------------------
//-----------------------------------------------------------------
//-----------------------------------------------------------------
function md5 (str) {
    // Calculate the md5 hash of a string  
    //  
    // version: 1109.2015
    // discuss at: http://phpjs.org/functions/md5
    // +   original by: Webtoolkit.info (http://www.webtoolkit.info/)
    // + namespaced by: Michael White (http://getsprink.com)
    // +    tweaked by: Jack
    // +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // +      input by: Brett Zamir (http://brett-zamir.me)
    // +   bugfixed by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // -    depends on: utf8_encode
    // *     example 1: md5('Kevin van Zonneveld');
    // *     returns 1: '6e658d4bfcb59cc13f96c14450ac40b9'
    var xl;
 
    var rotateLeft = function (lValue, iShiftBits) {
        return (lValue << iShiftBits) | (lValue >>> (32 - iShiftBits));
    }; 
 
    var addUnsigned = function (lX, lY) {
        var lX4, lY4, lX8, lY8, lResult;
        lX8 = (lX & 0x80000000);
        lY8 = (lY & 0x80000000);
        lX4 = (lX & 0x40000000);
        lY4 = (lY & 0x40000000);
        lResult = (lX & 0x3FFFFFFF) + (lY & 0x3FFFFFFF);
        if (lX4 & lY4) {
            return (lResult ^ 0x80000000 ^ lX8 ^ lY8);
        }
        if (lX4 | lY4) {
            if (lResult & 0x40000000) {
                return (lResult ^ 0xC0000000 ^ lX8 ^ lY8);
            } else {
                return (lResult ^ 0x40000000 ^ lX8 ^ lY8);
            }
        } else {
            return (lResult ^ lX8 ^ lY8);
        }
    };
 
    var _F = function (x, y, z) {
        return (x & y) | ((~x) & z);
    };
    var _G = function (x, y, z) {
        return (x & z) | (y & (~z));
    };
    var _H = function (x, y, z) {
        return (x ^ y ^ z);
    };
    var _I = function (x, y, z) {
        return (y ^ (x | (~z)));
    };
 
    var _FF = function (a, b, c, d, x, s, ac) {
        a = addUnsigned(a, addUnsigned(addUnsigned(_F(b, c, d), x), ac));
        return addUnsigned(rotateLeft(a, s), b);
    };
 
    var _GG = function (a, b, c, d, x, s, ac) {
        a = addUnsigned(a, addUnsigned(addUnsigned(_G(b, c, d), x), ac));
        return addUnsigned(rotateLeft(a, s), b);
    };
 
    var _HH = function (a, b, c, d, x, s, ac) {
        a = addUnsigned(a, addUnsigned(addUnsigned(_H(b, c, d), x), ac));
        return addUnsigned(rotateLeft(a, s), b);
    };
 
    var _II = function (a, b, c, d, x, s, ac) {
        a = addUnsigned(a, addUnsigned(addUnsigned(_I(b, c, d), x), ac));
        return addUnsigned(rotateLeft(a, s), b);
    };
 
    var convertToWordArray = function (str) {
        var lWordCount;
        var lMessageLength = str.length;
        var lNumberOfWords_temp1 = lMessageLength + 8;
        var lNumberOfWords_temp2 = (lNumberOfWords_temp1 - (lNumberOfWords_temp1 % 64)) / 64;
        var lNumberOfWords = (lNumberOfWords_temp2 + 1) * 16;
        var lWordArray = new Array(lNumberOfWords - 1);
        var lBytePosition = 0;
        var lByteCount = 0;
        while (lByteCount < lMessageLength) {
            lWordCount = (lByteCount - (lByteCount % 4)) / 4;
            lBytePosition = (lByteCount % 4) * 8;
            lWordArray[lWordCount] = (lWordArray[lWordCount] | (str.charCodeAt(lByteCount) << lBytePosition));
            lByteCount++;
        }
        lWordCount = (lByteCount - (lByteCount % 4)) / 4;
        lBytePosition = (lByteCount % 4) * 8;
        lWordArray[lWordCount] = lWordArray[lWordCount] | (0x80 << lBytePosition);
        lWordArray[lNumberOfWords - 2] = lMessageLength << 3;
        lWordArray[lNumberOfWords - 1] = lMessageLength >>> 29;
        return lWordArray;
    };
 
    var wordToHex = function (lValue) {
        var wordToHexValue = "",
            wordToHexValue_temp = "",
            lByte, lCount;
        for (lCount = 0; lCount <= 3; lCount++) {
            lByte = (lValue >>> (lCount * 8)) & 255;
            wordToHexValue_temp = "0" + lByte.toString(16);
            wordToHexValue = wordToHexValue + wordToHexValue_temp.substr(wordToHexValue_temp.length - 2, 2);
        }
        return wordToHexValue;
    };
 
    var x = [],
        k, AA, BB, CC, DD, a, b, c, d, S11 = 7,
        S12 = 12,
        S13 = 17,
        S14 = 22,
        S21 = 5,
        S22 = 9,
        S23 = 14,
        S24 = 20,
        S31 = 4,
        S32 = 11,
        S33 = 16,
        S34 = 23,
        S41 = 6,
        S42 = 10,
        S43 = 15,
        S44 = 21;
 
    str = this.utf8_encode(str);
    x = convertToWordArray(str);
    a = 0x67452301;
    b = 0xEFCDAB89;
    c = 0x98BADCFE;
    d = 0x10325476;
 
    xl = x.length;
    for (k = 0; k < xl; k += 16) {
        AA = a;
        BB = b;
        CC = c;
        DD = d;
        a = _FF(a, b, c, d, x[k + 0], S11, 0xD76AA478);
        d = _FF(d, a, b, c, x[k + 1], S12, 0xE8C7B756);
        c = _FF(c, d, a, b, x[k + 2], S13, 0x242070DB);
        b = _FF(b, c, d, a, x[k + 3], S14, 0xC1BDCEEE);
        a = _FF(a, b, c, d, x[k + 4], S11, 0xF57C0FAF);
        d = _FF(d, a, b, c, x[k + 5], S12, 0x4787C62A);
        c = _FF(c, d, a, b, x[k + 6], S13, 0xA8304613);
        b = _FF(b, c, d, a, x[k + 7], S14, 0xFD469501);
        a = _FF(a, b, c, d, x[k + 8], S11, 0x698098D8);
        d = _FF(d, a, b, c, x[k + 9], S12, 0x8B44F7AF);
        c = _FF(c, d, a, b, x[k + 10], S13, 0xFFFF5BB1);
        b = _FF(b, c, d, a, x[k + 11], S14, 0x895CD7BE);
        a = _FF(a, b, c, d, x[k + 12], S11, 0x6B901122);
        d = _FF(d, a, b, c, x[k + 13], S12, 0xFD987193);
        c = _FF(c, d, a, b, x[k + 14], S13, 0xA679438E);
        b = _FF(b, c, d, a, x[k + 15], S14, 0x49B40821);
        a = _GG(a, b, c, d, x[k + 1], S21, 0xF61E2562);
        d = _GG(d, a, b, c, x[k + 6], S22, 0xC040B340);
        c = _GG(c, d, a, b, x[k + 11], S23, 0x265E5A51);
        b = _GG(b, c, d, a, x[k + 0], S24, 0xE9B6C7AA);
        a = _GG(a, b, c, d, x[k + 5], S21, 0xD62F105D);
        d = _GG(d, a, b, c, x[k + 10], S22, 0x2441453);
        c = _GG(c, d, a, b, x[k + 15], S23, 0xD8A1E681);
        b = _GG(b, c, d, a, x[k + 4], S24, 0xE7D3FBC8);
        a = _GG(a, b, c, d, x[k + 9], S21, 0x21E1CDE6);
        d = _GG(d, a, b, c, x[k + 14], S22, 0xC33707D6);
        c = _GG(c, d, a, b, x[k + 3], S23, 0xF4D50D87);
        b = _GG(b, c, d, a, x[k + 8], S24, 0x455A14ED);
        a = _GG(a, b, c, d, x[k + 13], S21, 0xA9E3E905);
        d = _GG(d, a, b, c, x[k + 2], S22, 0xFCEFA3F8);
        c = _GG(c, d, a, b, x[k + 7], S23, 0x676F02D9);
        b = _GG(b, c, d, a, x[k + 12], S24, 0x8D2A4C8A);
        a = _HH(a, b, c, d, x[k + 5], S31, 0xFFFA3942);
        d = _HH(d, a, b, c, x[k + 8], S32, 0x8771F681);
        c = _HH(c, d, a, b, x[k + 11], S33, 0x6D9D6122);
        b = _HH(b, c, d, a, x[k + 14], S34, 0xFDE5380C);
        a = _HH(a, b, c, d, x[k + 1], S31, 0xA4BEEA44);
        d = _HH(d, a, b, c, x[k + 4], S32, 0x4BDECFA9);
        c = _HH(c, d, a, b, x[k + 7], S33, 0xF6BB4B60);
        b = _HH(b, c, d, a, x[k + 10], S34, 0xBEBFBC70);
        a = _HH(a, b, c, d, x[k + 13], S31, 0x289B7EC6);
        d = _HH(d, a, b, c, x[k + 0], S32, 0xEAA127FA);
        c = _HH(c, d, a, b, x[k + 3], S33, 0xD4EF3085);
        b = _HH(b, c, d, a, x[k + 6], S34, 0x4881D05);
        a = _HH(a, b, c, d, x[k + 9], S31, 0xD9D4D039);
        d = _HH(d, a, b, c, x[k + 12], S32, 0xE6DB99E5);
        c = _HH(c, d, a, b, x[k + 15], S33, 0x1FA27CF8);
        b = _HH(b, c, d, a, x[k + 2], S34, 0xC4AC5665);
        a = _II(a, b, c, d, x[k + 0], S41, 0xF4292244);
        d = _II(d, a, b, c, x[k + 7], S42, 0x432AFF97);
        c = _II(c, d, a, b, x[k + 14], S43, 0xAB9423A7);
        b = _II(b, c, d, a, x[k + 5], S44, 0xFC93A039);
        a = _II(a, b, c, d, x[k + 12], S41, 0x655B59C3);
        d = _II(d, a, b, c, x[k + 3], S42, 0x8F0CCC92);
        c = _II(c, d, a, b, x[k + 10], S43, 0xFFEFF47D);
        b = _II(b, c, d, a, x[k + 1], S44, 0x85845DD1);
        a = _II(a, b, c, d, x[k + 8], S41, 0x6FA87E4F);
        d = _II(d, a, b, c, x[k + 15], S42, 0xFE2CE6E0);
        c = _II(c, d, a, b, x[k + 6], S43, 0xA3014314);
        b = _II(b, c, d, a, x[k + 13], S44, 0x4E0811A1);
        a = _II(a, b, c, d, x[k + 4], S41, 0xF7537E82);
        d = _II(d, a, b, c, x[k + 11], S42, 0xBD3AF235);
        c = _II(c, d, a, b, x[k + 2], S43, 0x2AD7D2BB);
        b = _II(b, c, d, a, x[k + 9], S44, 0xEB86D391);
        a = addUnsigned(a, AA);
        b = addUnsigned(b, BB);
        c = addUnsigned(c, CC);
        d = addUnsigned(d, DD);
    }
 
    var temp = wordToHex(a) + wordToHex(b) + wordToHex(c) + wordToHex(d);
 
    return temp.toLowerCase();
}
//-----------------------------------------------------------------
//-----------------------------------------------------------------
function uniqid (prefix, more_entropy) {
    // +   original by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // +    revised by: Kankrelune (http://www.webfaktory.info/)
    // %        note 1: Uses an internal counter (in php_js global) to avoid collision
    // *     example 1: uniqid();
    // *     returns 1: 'a30285b160c14'
    // *     example 2: uniqid('foo');
    // *     returns 2: 'fooa30285b1cd361'
    // *     example 3: uniqid('bar', true);
    // *     returns 3: 'bara20285b23dfd1.31879087'
    if (typeof prefix == 'undefined') {
        prefix = "";
    }
 
    var retId;
    var formatSeed = function (seed, reqWidth) {
        seed = parseInt(seed, 10).toString(16); // to hex str
        if (reqWidth < seed.length) { // so long we split
            return seed.slice(seed.length - reqWidth);
        }
        if (reqWidth > seed.length) { // so short we pad
            return Array(1 + (reqWidth - seed.length)).join('0') + seed;
        }
        return seed;
    };
 
    // BEGIN REDUNDANT
    if (!this.php_js) {
        this.php_js = {};
    }
    // END REDUNDANT
    if (!this.php_js.uniqidSeed) { // init seed with big random int
        this.php_js.uniqidSeed = Math.floor(Math.random() * 0x75bcd15);
    }
    this.php_js.uniqidSeed++;
 
    retId = prefix; // start with prefix, add current milliseconds hex string
    retId += formatSeed(parseInt(new Date().getTime() / 1000, 10), 8);
    retId += formatSeed(this.php_js.uniqidSeed, 5); // add seed hex string
    if (more_entropy) {
        // for more entropy we add a float lower to 10
        retId += (Math.random() * 10).toFixed(8).toString();
    }
 
    return retId;
}

/*

字串->陣列 by 分隔符號

*/
function explode(delimiter, string, limit) {
  //  discuss at: http://phpjs.org/functions/explode/
  // original by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
  //   example 1: explode(' ', 'Kevin van Zonneveld');
  //   returns 1: {0: 'Kevin', 1: 'van', 2: 'Zonneveld'}

  if (arguments.length < 2 || typeof delimiter === 'undefined' || typeof string === 'undefined') return null;
  if (delimiter === '' || delimiter === false || delimiter === null) return false;
  if (typeof delimiter === 'function' || typeof delimiter === 'object' || typeof string === 'function' || typeof string ===
    'object') {
    return {
      0: ''
    };
  }
  if (delimiter === true) delimiter = '1';

  // Here we go...
  delimiter += '';
  string += '';

  var s = string.split(delimiter);

  if (typeof limit === 'undefined') return s;

  // Support for limit
  if (limit === 0) limit = 1;

  // Positive limit
  if (limit > 0) {
    if (limit >= s.length) return s;
    return s.slice(0, limit - 1)
      .concat([s.slice(limit - 1)
        .join(delimiter)
      ]);
  }

  // Negative limit
  if (-limit >= s.length) return [];

  s.splice(s.length + limit);
  return s;
}


/*

陣列->字串 by 分隔符號

*/

function implode(glue, pieces) {
  //  discuss at: http://phpjs.org/functions/implode/
  // original by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
  // improved by: Waldo Malqui Silva
  // improved by: Itsacon (http://www.itsacon.net/)
  // bugfixed by: Brett Zamir (http://brett-zamir.me)
  //   example 1: implode(' ', ['Kevin', 'van', 'Zonneveld']);
  //   returns 1: 'Kevin van Zonneveld'
  //   example 2: implode(' ', {first:'Kevin', last: 'van Zonneveld'});
  //   returns 2: 'Kevin van Zonneveld'

  var i = '',
    retVal = '',
    tGlue = '';
  if (arguments.length === 1) {
    pieces = glue;
    glue = '';
  }
  if (typeof pieces === 'object') {
    if (Object.prototype.toString.call(pieces) === '[object Array]') {
      return pieces.join(glue);
    }
    for (i in pieces) {
      retVal += tGlue + pieces[i];
      tGlue = glue;
    }
    return retVal;
  }
  return pieces;
}


/*
浮點數
*/

//浮點數相加
function bcadd(left_operand, right_operand, scale) {
  //  discuss at: http://phpjs.org/functions/bcadd/
  // original by: lmeyrick (https://sourceforge.net/projects/bcmath-js/)
  //  depends on: _phpjs_shared_bc
  //   example 1: bcadd(1, 2);
  //   returns 1: 3
  //        todo: implement these testcases

  var libbcmath = this._phpjs_shared_bc();

  var first, second, result;

  if (typeof scale === 'undefined') {
    scale = libbcmath.scale;
  }
  scale = ((scale < 0) ? 0 : scale);

  // create objects
  first = libbcmath.bc_init_num();
  second = libbcmath.bc_init_num();
  result = libbcmath.bc_init_num();

  first = libbcmath.php_str2num(left_operand.toString());
  second = libbcmath.php_str2num(right_operand.toString());

  result = libbcmath.bc_add(first, second, scale);

  if (result.n_scale > scale) {
    result.n_scale = scale;
  }

  return result.toString();
}
//浮點數相減
function bcsub(left_operand, right_operand, scale) {
  //  discuss at: http://phpjs.org/functions/bcsub/
  // original by: lmeyrick (https://sourceforge.net/projects/bcmath-js/)
  //  depends on: _phpjs_shared_bc
  //   example 1: bcsub(1, 2);
  //   returns 1: -1
  //        todo: implement these testcases

  var libbcmath = this._phpjs_shared_bc();

  var first, second, result;

  if (typeof scale === 'undefined') {
    scale = libbcmath.scale;
  }
  scale = ((scale < 0) ? 0 : scale);

  // create objects
  first = libbcmath.bc_init_num();
  second = libbcmath.bc_init_num();
  result = libbcmath.bc_init_num();

  first = libbcmath.php_str2num(left_operand.toString());
  second = libbcmath.php_str2num(right_operand.toString());

  result = libbcmath.bc_sub(first, second, scale);

  if (result.n_scale > scale) {
    result.n_scale = scale;
  }

  return result.toString();
}

//浮點數相乘
function bcmul(left_operand, right_operand, scale) {
  //  discuss at: http://phpjs.org/functions/bcmul/
  // original by: lmeyrick (https://sourceforge.net/projects/bcmath-js/)
  //  depends on: _phpjs_shared_bc
  //   example 1: bcmul(1, 2);
  //   returns 1: 3
  //        todo: implement these testcases

  var libbcmath = this._phpjs_shared_bc();

  var first, second, result;

  if (typeof scale === 'undefined') {
    scale = libbcmath.scale;
  }
  scale = ((scale < 0) ? 0 : scale);

  // create objects
  first = libbcmath.bc_init_num();
  second = libbcmath.bc_init_num();
  result = libbcmath.bc_init_num();

  first = libbcmath.php_str2num(left_operand.toString());
  second = libbcmath.php_str2num(right_operand.toString());

  result = libbcmath.bc_multiply(first, second, scale);

  if (result.n_scale > scale) {
    result.n_scale = scale;
  }
  return result.toString();
}

/*
浮點數相除
*/
function bcdiv(left_operand, right_operand, scale) {
  //  discuss at: http://phpjs.org/functions/bcdiv/
  // original by: lmeyrick (https://sourceforge.net/projects/bcmath-js/)
  //  depends on: _phpjs_shared_bc
  //   example 1: bcdiv(1, 2);
  //   returns 1: 3
  //        todo: implement these testcases

  var libbcmath = this._phpjs_shared_bc();

  var first, second, result;

  if (typeof scale === 'undefined') {
    scale = libbcmath.scale;
  }
  scale = ((scale < 0) ? 0 : scale);

  // create objects
  first = libbcmath.bc_init_num();
  second = libbcmath.bc_init_num();
  result = libbcmath.bc_init_num();

  first = libbcmath.php_str2num(left_operand.toString());
  second = libbcmath.php_str2num(right_operand.toString());

  result = libbcmath.bc_divide(first, second, scale);
  if (result === -1) {
    // error
    // throw new Error(11, '(BC) Division by zero');
  }
  if (result.n_scale > scale) {
    result.n_scale = scale;
  }
  return result.toString();
}

/*


*/
function bccomp(left_operand, right_operand, scale) {
  //  discuss at: http://phpjs.org/functions/bccomp/
  // original by: lmeyrick (https://sourceforge.net/projects/bcmath-js/)
  //  depends on: _phpjs_shared_bc
  //   example 1: bccomp(1, 2);
  //   returns 1: 3
  //        todo: implement these testcases

  var libbcmath = this._phpjs_shared_bc();

  var first, second; //bc_num
  if (typeof scale === 'undefined') {
    scale = libbcmath.scale;
  }
  scale = ((scale < 0) ? 0 : scale);

  first = libbcmath.bc_init_num();
  second = libbcmath.bc_init_num();

  first = libbcmath.bc_str2num(left_operand.toString(), scale); // note bc_ not php_str2num
  second = libbcmath.bc_str2num(right_operand.toString(), scale); // note bc_ not php_str2num
  return libbcmath.bc_compare(first, second, scale);
}

function bcround(val, precision) {
  //  discuss at: http://phpjs.org/functions/bcround/
  // original by: lmeyrick (https://sourceforge.net/projects/bcmath-js/)
  //  depends on: _phpjs_shared_bc
  //   example 1: bcround(1, 2);
  //   returns 1: 3
  //        todo: implement these testcases

  var libbcmath = this._phpjs_shared_bc();

  var temp, result, digit;
  var right_operand;

  // create number
  temp = libbcmath.bc_init_num();
  temp = libbcmath.php_str2num(val.toString());

  // check if any rounding needs
  if (precision >= temp.n_scale) {
    // nothing to round, just add the zeros.
    while (temp.n_scale < precision) {
      temp.n_value[temp.n_len + temp.n_scale] = 0;
      temp.n_scale++;
    }
    return temp.toString();
  }

  // get the digit we are checking (1 after the precision)
  // loop through digits after the precision marker
  digit = temp.n_value[temp.n_len + precision];

  right_operand = libbcmath.bc_init_num();
  right_operand = libbcmath.bc_new_num(1, precision);

  if (digit >= 5) {
    //round away from zero by adding 1 (or -1) at the "precision".. ie 1.44999 @ 3dp = (1.44999 + 0.001).toString().substr(0,5)
    right_operand.n_value[right_operand.n_len + right_operand.n_scale - 1] = 1;
    if (temp.n_sign == libbcmath.MINUS) {
      // round down
      right_operand.n_sign = libbcmath.MINUS;
    }
    result = libbcmath.bc_add(temp, right_operand, precision);
  } else {
    // leave-as-is.. just truncate it.
    result = temp;
  }

  if (result.n_scale > precision) {
    result.n_scale = precision;
  }
  return result.toString();
}

function bcscale(scale) {
  //  discuss at: http://phpjs.org/functions/bcscale/
  // original by: lmeyrick (https://sourceforge.net/projects/bcmath-js/)this.
  //  depends on: _phpjs_shared_bc
  //   example 1: bcscale(1);
  //   returns 1: 3
  //        todo: implement these testcases

  var libbcmath = this._phpjs_shared_bc();

  scale = parseInt(scale, 10);
  if (isNaN(scale)) {
    return false;
  }
  if (scale < 0) {
    return false;
  }
  libbcmath.scale = scale;
  return true;
}

/*

判斷值

*/
function isset() {
    // !No description available for isset. @php.js developers: Please update the function summary text file.
    // 
    // version: 1103.1210
    // discuss at: http://phpjs.org/functions/isset
    // +   original by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // +   improved by: FremyCompany
    // +   improved by: Onno Marsman
    // +   improved by: Rafał Kukawski
    // *     example 1: isset( undefined, true);
    // *     returns 1: false
    // *     example 2: isset( 'Kevin van Zonneveld' );
    // *     returns 2: true
    var a = arguments,
        l = a.length,
        i = 0,
        undef;
 
    if (l === 0) {
        throw new Error('Empty isset');
    }
 
    while (i !== l) {
        if (a[i] === undef || a[i] === null) {
            return false;
        }
        i++;
    }
    return true;
}

function empty(mixed_var) {
  //  discuss at: http://phpjs.org/functions/empty/
  // original by: Philippe Baumann
  //    input by: Onno Marsman
  //    input by: LH
  //    input by: Stoyan Kyosev (http://www.svest.org/)
  // bugfixed by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
  // improved by: Onno Marsman
  // improved by: Francesco
  // improved by: Marc Jansen
  // improved by: Rafal Kukawski
  //   example 1: empty(null);
  //   returns 1: true
  //   example 2: empty(undefined);
  //   returns 2: true
  //   example 3: empty([]);
  //   returns 3: true
  //   example 4: empty({});
  //   returns 4: true
  //   example 5: empty({'aFunc' : function () { alert('humpty'); } });
  //   returns 5: false

  var undef, key, i, len;
  var emptyValues = [undef, null, false, 0, '', '0'];

  for (i = 0, len = emptyValues.length; i < len; i++) {
    if (mixed_var === emptyValues[i]) {
      return true;
    }
  }

  if (typeof mixed_var === 'object') {
    for (key in mixed_var) {
      // TODO: should we check for own properties only?
      //if (mixed_var.hasOwnProperty(key)) {
      return false;
      //}
    }
    return true;
  }

  return false;
}


/*
DATE
*/

function date(format, timestamp) {
  //  discuss at: http://phpjs.org/functions/date/
  // original by: Carlos R. L. Rodrigues (http://www.jsfromhell.com)
  // original by: gettimeofday
  //    parts by: Peter-Paul Koch (http://www.quirksmode.org/js/beat.html)
  // improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
  // improved by: MeEtc (http://yass.meetcweb.com)
  // improved by: Brad Touesnard
  // improved by: Tim Wiel
  // improved by: Bryan Elliott
  // improved by: David Randall
  // improved by: Theriault
  // improved by: Theriault
  // improved by: Brett Zamir (http://brett-zamir.me)
  // improved by: Theriault
  // improved by: Thomas Beaucourt (http://www.webapp.fr)
  // improved by: JT
  // improved by: Theriault
  // improved by: Rafał Kukawski (http://blog.kukawski.pl)
  // improved by: Theriault
  //    input by: Brett Zamir (http://brett-zamir.me)
  //    input by: majak
  //    input by: Alex
  //    input by: Martin
  //    input by: Alex Wilson
  //    input by: Haravikk
  // bugfixed by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
  // bugfixed by: majak
  // bugfixed by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
  // bugfixed by: Brett Zamir (http://brett-zamir.me)
  // bugfixed by: omid (http://phpjs.org/functions/380:380#comment_137122)
  // bugfixed by: Chris (http://www.devotis.nl/)
  //        note: Uses global: php_js to store the default timezone
  //        note: Although the function potentially allows timezone info (see notes), it currently does not set
  //        note: per a timezone specified by date_default_timezone_set(). Implementers might use
  //        note: this.php_js.currentTimezoneOffset and this.php_js.currentTimezoneDST set by that function
  //        note: in order to adjust the dates in this function (or our other date functions!) accordingly
  //   example 1: date('H:m:s \\m \\i\\s \\m\\o\\n\\t\\h', 1062402400);
  //   returns 1: '09:09:40 m is month'
  //   example 2: date('F j, Y, g:i a', 1062462400);
  //   returns 2: 'September 2, 2003, 2:26 am'
  //   example 3: date('Y W o', 1062462400);
  //   returns 3: '2003 36 2003'
  //   example 4: x = date('Y m d', (new Date()).getTime()/1000);
  //   example 4: (x+'').length == 10 // 2009 01 09
  //   returns 4: true
  //   example 5: date('W', 1104534000);
  //   returns 5: '53'
  //   example 6: date('B t', 1104534000);
  //   returns 6: '999 31'
  //   example 7: date('W U', 1293750000.82); // 2010-12-31
  //   returns 7: '52 1293750000'
  //   example 8: date('W', 1293836400); // 2011-01-01
  //   returns 8: '52'
  //   example 9: date('W Y-m-d', 1293974054); // 2011-01-02
  //   returns 9: '52 2011-01-02'

  var that = this;
  var jsdate, f;
  // Keep this here (works, but for code commented-out below for file size reasons)
  // var tal= [];
  var txt_words = [
    'Sun', 'Mon', 'Tues', 'Wednes', 'Thurs', 'Fri', 'Satur',
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  // trailing backslash -> (dropped)
  // a backslash followed by any character (including backslash) -> the character
  // empty string -> empty string
  var formatChr = /\\?(.?)/gi;
  var formatChrCb = function(t, s) {
    return f[t] ? f[t]() : s;
  };
  var _pad = function(n, c) {
    n = String(n);
    while (n.length < c) {
      n = '0' + n;
    }
    return n;
  };
  f = {
    // Day
    d: function() { // Day of month w/leading 0; 01..31
      return _pad(f.j(), 2);
    },
    D: function() { // Shorthand day name; Mon...Sun
      return f.l()
        .slice(0, 3);
    },
    j: function() { // Day of month; 1..31
      return jsdate.getDate();
    },
    l: function() { // Full day name; Monday...Sunday
      return txt_words[f.w()] + 'day';
    },
    N: function() { // ISO-8601 day of week; 1[Mon]..7[Sun]
      return f.w() || 7;
    },
    S: function() { // Ordinal suffix for day of month; st, nd, rd, th
      var j = f.j();
      var i = j % 10;
      if (i <= 3 && parseInt((j % 100) / 10, 10) == 1) {
        i = 0;
      }
      return ['st', 'nd', 'rd'][i - 1] || 'th';
    },
    w: function() { // Day of week; 0[Sun]..6[Sat]
      return jsdate.getDay();
    },
    z: function() { // Day of year; 0..365
      var a = new Date(f.Y(), f.n() - 1, f.j());
      var b = new Date(f.Y(), 0, 1);
      return Math.round((a - b) / 864e5);
    },

    // Week
    W: function() { // ISO-8601 week number
      var a = new Date(f.Y(), f.n() - 1, f.j() - f.N() + 3);
      var b = new Date(a.getFullYear(), 0, 4);
      return _pad(1 + Math.round((a - b) / 864e5 / 7), 2);
    },

    // Month
    F: function() { // Full month name; January...December
      return txt_words[6 + f.n()];
    },
    m: function() { // Month w/leading 0; 01...12
      return _pad(f.n(), 2);
    },
    M: function() { // Shorthand month name; Jan...Dec
      return f.F()
        .slice(0, 3);
    },
    n: function() { // Month; 1...12
      return jsdate.getMonth() + 1;
    },
    t: function() { // Days in month; 28...31
      return (new Date(f.Y(), f.n(), 0))
        .getDate();
    },

    // Year
    L: function() { // Is leap year?; 0 or 1
      var j = f.Y();
      return j % 4 === 0 & j % 100 !== 0 | j % 400 === 0;
    },
    o: function() { // ISO-8601 year
      var n = f.n();
      var W = f.W();
      var Y = f.Y();
      return Y + (n === 12 && W < 9 ? 1 : n === 1 && W > 9 ? -1 : 0);
    },
    Y: function() { // Full year; e.g. 1980...2010
      return jsdate.getFullYear();
    },
    y: function() { // Last two digits of year; 00...99
      return f.Y()
        .toString()
        .slice(-2);
    },

    // Time
    a: function() { // am or pm
      return jsdate.getHours() > 11 ? 'pm' : 'am';
    },
    A: function() { // AM or PM
      return f.a()
        .toUpperCase();
    },
    B: function() { // Swatch Internet time; 000..999
      var H = jsdate.getUTCHours() * 36e2;
      // Hours
      var i = jsdate.getUTCMinutes() * 60;
      // Minutes
      var s = jsdate.getUTCSeconds(); // Seconds
      return _pad(Math.floor((H + i + s + 36e2) / 86.4) % 1e3, 3);
    },
    g: function() { // 12-Hours; 1..12
      return f.G() % 12 || 12;
    },
    G: function() { // 24-Hours; 0..23
      return jsdate.getHours();
    },
    h: function() { // 12-Hours w/leading 0; 01..12
      return _pad(f.g(), 2);
    },
    H: function() { // 24-Hours w/leading 0; 00..23
      return _pad(f.G(), 2);
    },
    i: function() { // Minutes w/leading 0; 00..59
      return _pad(jsdate.getMinutes(), 2);
    },
    s: function() { // Seconds w/leading 0; 00..59
      return _pad(jsdate.getSeconds(), 2);
    },
    u: function() { // Microseconds; 000000-999000
      return _pad(jsdate.getMilliseconds() * 1000, 6);
    },

    // Timezone
    e: function() { // Timezone identifier; e.g. Atlantic/Azores, ...
      // The following works, but requires inclusion of the very large
      // timezone_abbreviations_list() function.
      /*              return that.date_default_timezone_get();
       */
      throw 'Not supported (see source code of date() for timezone on how to add support)';
    },
    I: function() { // DST observed?; 0 or 1
      // Compares Jan 1 minus Jan 1 UTC to Jul 1 minus Jul 1 UTC.
      // If they are not equal, then DST is observed.
      var a = new Date(f.Y(), 0);
      // Jan 1
      var c = Date.UTC(f.Y(), 0);
      // Jan 1 UTC
      var b = new Date(f.Y(), 6);
      // Jul 1
      var d = Date.UTC(f.Y(), 6); // Jul 1 UTC
      return ((a - c) !== (b - d)) ? 1 : 0;
    },
    O: function() { // Difference to GMT in hour format; e.g. +0200
      var tzo = jsdate.getTimezoneOffset();
      var a = Math.abs(tzo);
      return (tzo > 0 ? '-' : '+') + _pad(Math.floor(a / 60) * 100 + a % 60, 4);
    },
    P: function() { // Difference to GMT w/colon; e.g. +02:00
      var O = f.O();
      return (O.substr(0, 3) + ':' + O.substr(3, 2));
    },
    T: function() { // Timezone abbreviation; e.g. EST, MDT, ...
      // The following works, but requires inclusion of the very
      // large timezone_abbreviations_list() function.
      /*              var abbr, i, os, _default;
      if (!tal.length) {
        tal = that.timezone_abbreviations_list();
      }
      if (that.php_js && that.php_js.default_timezone) {
        _default = that.php_js.default_timezone;
        for (abbr in tal) {
          for (i = 0; i < tal[abbr].length; i++) {
            if (tal[abbr][i].timezone_id === _default) {
              return abbr.toUpperCase();
            }
          }
        }
      }
      for (abbr in tal) {
        for (i = 0; i < tal[abbr].length; i++) {
          os = -jsdate.getTimezoneOffset() * 60;
          if (tal[abbr][i].offset === os) {
            return abbr.toUpperCase();
          }
        }
      }
      */
      return 'UTC';
    },
    Z: function() { // Timezone offset in seconds (-43200...50400)
      return -jsdate.getTimezoneOffset() * 60;
    },

    // Full Date/Time
    c: function() { // ISO-8601 date.
      return 'Y-m-d\\TH:i:sP'.replace(formatChr, formatChrCb);
    },
    r: function() { // RFC 2822
      return 'D, d M Y H:i:s O'.replace(formatChr, formatChrCb);
    },
    U: function() { // Seconds since UNIX epoch
      return jsdate / 1000 | 0;
    }
  };
  this.date = function(format, timestamp) {
    that = this;
    jsdate = (timestamp === undefined ? new Date() : // Not provided
      (timestamp instanceof Date) ? new Date(timestamp) : // JS Date()
      new Date(timestamp * 1000) // UNIX timestamp (auto-convert to int)
    );
    return format.replace(formatChr, formatChrCb);
  };
  return this.date(format, timestamp);
}

function mktime() {
  //  discuss at: http://phpjs.org/functions/mktime/
  // original by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
  // improved by: baris ozdil
  // improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
  // improved by: FGFEmperor
  // improved by: Brett Zamir (http://brett-zamir.me)
  //    input by: gabriel paderni
  //    input by: Yannoo
  //    input by: jakes
  //    input by: 3D-GRAF
  //    input by: Chris
  // bugfixed by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
  // bugfixed by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
  // bugfixed by: Marc Palau
  // bugfixed by: Brett Zamir (http://brett-zamir.me)
  //  revised by: Theriault
  //        note: The return values of the following examples are
  //        note: received only if your system's timezone is UTC.
  //   example 1: mktime(14, 10, 2, 2, 1, 2008);
  //   returns 1: 1201875002
  //   example 2: mktime(0, 0, 0, 0, 1, 2008);
  //   returns 2: 1196467200
  //   example 3: make = mktime();
  //   example 3: td = new Date();
  //   example 3: real = Math.floor(td.getTime() / 1000);
  //   example 3: diff = (real - make);
  //   example 3: diff < 5
  //   returns 3: true
  //   example 4: mktime(0, 0, 0, 13, 1, 1997)
  //   returns 4: 883612800
  //   example 5: mktime(0, 0, 0, 1, 1, 1998)
  //   returns 5: 883612800
  //   example 6: mktime(0, 0, 0, 1, 1, 98)
  //   returns 6: 883612800
  //   example 7: mktime(23, 59, 59, 13, 0, 2010)
  //   returns 7: 1293839999
  //   example 8: mktime(0, 0, -1, 1, 1, 1970)
  //   returns 8: -1

  var d = new Date(),
    r = arguments,
    i = 0,
    e = ['Hours', 'Minutes', 'Seconds', 'Month', 'Date', 'FullYear'];

  for (i = 0; i < e.length; i++) {
    if (typeof r[i] === 'undefined') {
      r[i] = d['get' + e[i]]();
      r[i] += (i === 3); // +1 to fix JS months.
    } else {
      r[i] = parseInt(r[i], 10);
      if (isNaN(r[i])) {
        return false;
      }
    }
  }

  // Map years 0-69 to 2000-2069 and years 70-100 to 1970-2000.
  r[5] += (r[5] >= 0 ? (r[5] <= 69 ? 2e3 : (r[5] <= 100 ? 1900 : 0)) : 0);

  // Set year, month (-1 to fix JS months), and date.
  // !This must come before the call to setHours!
  d.setFullYear(r[5], r[3] - 1, r[4]);

  // Set hours, minutes, and seconds.
  d.setHours(r[0], r[1], r[2]);

  // Divide milliseconds by 1000 to return seconds and drop decimal.
  // Add 1 second if negative or it'll be off from PHP by 1 second.
  return (d.getTime() / 1e3 >> 0) - (d.getTime() < 0);
}


function strtotime(text, now) {
  //  discuss at: http://phpjs.org/functions/strtotime/
  //     version: 1109.2016
  // original by: Caio Ariede (http://caioariede.com)
  // improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
  // improved by: Caio Ariede (http://caioariede.com)
  // improved by: A. Matías Quezada (http://amatiasq.com)
  // improved by: preuter
  // improved by: Brett Zamir (http://brett-zamir.me)
  // improved by: Mirko Faber
  //    input by: David
  // bugfixed by: Wagner B. Soares
  // bugfixed by: Artur Tchernychev
  //        note: Examples all have a fixed timestamp to prevent tests to fail because of variable time(zones)
  //   example 1: strtotime('+1 day', 1129633200);
  //   returns 1: 1129719600
  //   example 2: strtotime('+1 week 2 days 4 hours 2 seconds', 1129633200);
  //   returns 2: 1130425202
  //   example 3: strtotime('last month', 1129633200);
  //   returns 3: 1127041200
  //   example 4: strtotime('2009-05-04 08:30:00 GMT');
  //   returns 4: 1241425800

  var parsed, match, today, year, date, days, ranges, len, times, regex, i, fail = false;

  if (!text) {
    return fail;
  }

  // Unecessary spaces
  text = text.replace(/^\s+|\s+$/g, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/[\t\r\n]/g, '')
    .toLowerCase();

  // in contrast to php, js Date.parse function interprets:
  // dates given as yyyy-mm-dd as in timezone: UTC,
  // dates with "." or "-" as MDY instead of DMY
  // dates with two-digit years differently
  // etc...etc...
  // ...therefore we manually parse lots of common date formats
  match = text.match(
    /^(\d{1,4})([\-\.\/\:])(\d{1,2})([\-\.\/\:])(\d{1,4})(?:\s(\d{1,2}):(\d{2})?:?(\d{2})?)?(?:\s([A-Z]+)?)?$/);

  if (match && match[2] === match[4]) {
    if (match[1] > 1901) {
      switch (match[2]) {
        case '-':
          { // YYYY-M-D
            if (match[3] > 12 || match[5] > 31) {
              return fail;
            }

            return new Date(match[1], parseInt(match[3], 10) - 1, match[5],
              match[6] || 0, match[7] || 0, match[8] || 0, match[9] || 0) / 1000;
          }
        case '.':
          { // YYYY.M.D is not parsed by strtotime()
            return fail;
          }
        case '/':
          { // YYYY/M/D
            if (match[3] > 12 || match[5] > 31) {
              return fail;
            }

            return new Date(match[1], parseInt(match[3], 10) - 1, match[5],
              match[6] || 0, match[7] || 0, match[8] || 0, match[9] || 0) / 1000;
          }
      }
    } else if (match[5] > 1901) {
      switch (match[2]) {
        case '-':
          { // D-M-YYYY
            if (match[3] > 12 || match[1] > 31) {
              return fail;
            }

            return new Date(match[5], parseInt(match[3], 10) - 1, match[1],
              match[6] || 0, match[7] || 0, match[8] || 0, match[9] || 0) / 1000;
          }
        case '.':
          { // D.M.YYYY
            if (match[3] > 12 || match[1] > 31) {
              return fail;
            }

            return new Date(match[5], parseInt(match[3], 10) - 1, match[1],
              match[6] || 0, match[7] || 0, match[8] || 0, match[9] || 0) / 1000;
          }
        case '/':
          { // M/D/YYYY
            if (match[1] > 12 || match[3] > 31) {
              return fail;
            }

            return new Date(match[5], parseInt(match[1], 10) - 1, match[3],
              match[6] || 0, match[7] || 0, match[8] || 0, match[9] || 0) / 1000;
          }
      }
    } else {
      switch (match[2]) {
        case '-':
          { // YY-M-D
            if (match[3] > 12 || match[5] > 31 || (match[1] < 70 && match[1] > 38)) {
              return fail;
            }

            year = match[1] >= 0 && match[1] <= 38 ? +match[1] + 2000 : match[1];
            return new Date(year, parseInt(match[3], 10) - 1, match[5],
              match[6] || 0, match[7] || 0, match[8] || 0, match[9] || 0) / 1000;
          }
        case '.':
          { // D.M.YY or H.MM.SS
            if (match[5] >= 70) { // D.M.YY
              if (match[3] > 12 || match[1] > 31) {
                return fail;
              }

              return new Date(match[5], parseInt(match[3], 10) - 1, match[1],
                match[6] || 0, match[7] || 0, match[8] || 0, match[9] || 0) / 1000;
            }
            if (match[5] < 60 && !match[6]) { // H.MM.SS
              if (match[1] > 23 || match[3] > 59) {
                return fail;
              }

              today = new Date();
              return new Date(today.getFullYear(), today.getMonth(), today.getDate(),
                match[1] || 0, match[3] || 0, match[5] || 0, match[9] || 0) / 1000;
            }

            return fail; // invalid format, cannot be parsed
          }
        case '/':
          { // M/D/YY
            if (match[1] > 12 || match[3] > 31 || (match[5] < 70 && match[5] > 38)) {
              return fail;
            }

            year = match[5] >= 0 && match[5] <= 38 ? +match[5] + 2000 : match[5];
            return new Date(year, parseInt(match[1], 10) - 1, match[3],
              match[6] || 0, match[7] || 0, match[8] || 0, match[9] || 0) / 1000;
          }
        case ':':
          { // HH:MM:SS
            if (match[1] > 23 || match[3] > 59 || match[5] > 59) {
              return fail;
            }

            today = new Date();
            return new Date(today.getFullYear(), today.getMonth(), today.getDate(),
              match[1] || 0, match[3] || 0, match[5] || 0) / 1000;
          }
      }
    }
  }

  // other formats and "now" should be parsed by Date.parse()
  if (text === 'now') {
    return now === null || isNaN(now) ? new Date()
      .getTime() / 1000 | 0 : now | 0;
  }
  if (!isNaN(parsed = Date.parse(text))) {
    return parsed / 1000 | 0;
  }

  date = now ? new Date(now * 1000) : new Date();
  days = {
    'sun': 0,
    'mon': 1,
    'tue': 2,
    'wed': 3,
    'thu': 4,
    'fri': 5,
    'sat': 6
  };
  ranges = {
    'yea': 'FullYear',
    'mon': 'Month',
    'day': 'Date',
    'hou': 'Hours',
    'min': 'Minutes',
    'sec': 'Seconds'
  };

  function lastNext(type, range, modifier) {
    var diff, day = days[range];

    if (typeof day !== 'undefined') {
      diff = day - date.getDay();

      if (diff === 0) {
        diff = 7 * modifier;
      } else if (diff > 0 && type === 'last') {
        diff -= 7;
      } else if (diff < 0 && type === 'next') {
        diff += 7;
      }

      date.setDate(date.getDate() + diff);
    }
  }

  function process(val) {
    var splt = val.split(' '), // Todo: Reconcile this with regex using \s, taking into account browser issues with split and regexes
      type = splt[0],
      range = splt[1].substring(0, 3),
      typeIsNumber = /\d+/.test(type),
      ago = splt[2] === 'ago',
      num = (type === 'last' ? -1 : 1) * (ago ? -1 : 1);

    if (typeIsNumber) {
      num *= parseInt(type, 10);
    }

    if (ranges.hasOwnProperty(range) && !splt[1].match(/^mon(day|\.)?$/i)) {
      return date['set' + ranges[range]](date['get' + ranges[range]]() + num);
    }

    if (range === 'wee') {
      return date.setDate(date.getDate() + (num * 7));
    }

    if (type === 'next' || type === 'last') {
      lastNext(type, range, num);
    } else if (!typeIsNumber) {
      return false;
    }

    return true;
  }

  times = '(years?|months?|weeks?|days?|hours?|minutes?|min|seconds?|sec' +
    '|sunday|sun\\.?|monday|mon\\.?|tuesday|tue\\.?|wednesday|wed\\.?' +
    '|thursday|thu\\.?|friday|fri\\.?|saturday|sat\\.?)';
  regex = '([+-]?\\d+\\s' + times + '|' + '(last|next)\\s' + times + ')(\\sago)?';

  match = text.match(new RegExp(regex, 'gi'));
  if (!match) {
    return fail;
  }

  for (i = 0, len = match.length; i < len; i++) {
    if (!process(match[i])) {
      return fail;
    }
  }

  // ECMAScript 5 only
  // if (!match.every(process))
  //    return false;

  return (date.getTime() / 1000);
}

/*
JSON
*/

function json_decode(str_json) {
  //       discuss at: http://phpjs.org/functions/json_decode/
  //      original by: Public Domain (http://www.json.org/json2.js)
  // reimplemented by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
  //      improved by: T.J. Leahy
  //      improved by: Michael White
  //        example 1: json_decode('[ 1 ]');
  //        returns 1: [1]

  /*
    http://www.JSON.org/json2.js
    2008-11-19
    Public Domain.
    NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.
    See http://www.JSON.org/js.html
  */

  var json = this.window.JSON;
  if (typeof json === 'object' && typeof json.parse === 'function') {
    try {
      return json.parse(str_json);
    } catch (err) {
      if (!(err instanceof SyntaxError)) {
        throw new Error('Unexpected error type in json_decode()');
      }
      this.php_js = this.php_js || {};
      this.php_js.last_error_json = 4; // usable by json_last_error()
      return null;
    }
  }

  var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;
  var j;
  var text = str_json;

  // Parsing happens in four stages. In the first stage, we replace certain
  // Unicode characters with escape sequences. JavaScript handles many characters
  // incorrectly, either silently deleting them, or treating them as line endings.
  cx.lastIndex = 0;
  if (cx.test(text)) {
    text = text.replace(cx, function(a) {
      return '\\u' + ('0000' + a.charCodeAt(0)
        .toString(16))
        .slice(-4);
    });
  }

  // In the second stage, we run the text against regular expressions that look
  // for non-JSON patterns. We are especially concerned with '()' and 'new'
  // because they can cause invocation, and '=' because it can cause mutation.
  // But just to be safe, we want to reject all unexpected forms.
  // We split the second stage into 4 regexp operations in order to work around
  // crippling inefficiencies in IE's and Safari's regexp engines. First we
  // replace the JSON backslash pairs with '@' (a non-JSON character). Second, we
  // replace all simple value tokens with ']' characters. Third, we delete all
  // open brackets that follow a colon or comma or that begin the text. Finally,
  // we look to see that the remaining characters are only whitespace or ']' or
  // ',' or ':' or '{' or '}'. If that is so, then the text is safe for eval.
  if ((/^[\],:{}\s]*$/)
    .test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@')
      .replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']')
      .replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {

    // In the third stage we use the eval function to compile the text into a
    // JavaScript structure. The '{' operator is subject to a syntactic ambiguity
    // in JavaScript: it can begin a block or an object literal. We wrap the text
    // in parens to eliminate the ambiguity.
    j = eval('(' + text + ')');

    return j;
  }

  this.php_js = this.php_js || {};
  this.php_js.last_error_json = 4; // usable by json_last_error()
  return null;
}

function json_encode(mixed_val) {
  //       discuss at: http://phpjs.org/functions/json_encode/
  //      original by: Public Domain (http://www.json.org/json2.js)
  // reimplemented by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
  //      improved by: Michael White
  //         input by: felix
  //      bugfixed by: Brett Zamir (http://brett-zamir.me)
  //        example 1: json_encode('Kevin');
  //        returns 1: '"Kevin"'

  /*
    http://www.JSON.org/json2.js
    2008-11-19
    Public Domain.
    NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.
    See http://www.JSON.org/js.html
  */
  var retVal, json = this.window.JSON;
  try {
    if (typeof json === 'object' && typeof json.stringify === 'function') {
      retVal = json.stringify(mixed_val); // Errors will not be caught here if our own equivalent to resource
      //  (an instance of PHPJS_Resource) is used
      if (retVal === undefined) {
        throw new SyntaxError('json_encode');
      }
      return retVal;
    }

    var value = mixed_val;

    var quote = function(string) {
      var escapable =
        /[\\\"\u0000-\u001f\u007f-\u009f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;
      var meta = { // table of character substitutions
        '\b': '\\b',
        '\t': '\\t',
        '\n': '\\n',
        '\f': '\\f',
        '\r': '\\r',
        '"': '\\"',
        '\\': '\\\\'
      };

      escapable.lastIndex = 0;
      return escapable.test(string) ? '"' + string.replace(escapable, function(a) {
        var c = meta[a];
        return typeof c === 'string' ? c : '\\u' + ('0000' + a.charCodeAt(0)
          .toString(16))
          .slice(-4);
      }) + '"' : '"' + string + '"';
    };

    var str = function(key, holder) {
      var gap = '';
      var indent = '    ';
      var i = 0; // The loop counter.
      var k = ''; // The member key.
      var v = ''; // The member value.
      var length = 0;
      var mind = gap;
      var partial = [];
      var value = holder[key];

      // If the value has a toJSON method, call it to obtain a replacement value.
      if (value && typeof value === 'object' && typeof value.toJSON === 'function') {
        value = value.toJSON(key);
      }

      // What happens next depends on the value's type.
      switch (typeof value) {
        case 'string':
          return quote(value);

        case 'number':
          // JSON numbers must be finite. Encode non-finite numbers as null.
          return isFinite(value) ? String(value) : 'null';

        case 'boolean':
        case 'null':
          // If the value is a boolean or null, convert it to a string. Note:
          // typeof null does not produce 'null'. The case is included here in
          // the remote chance that this gets fixed someday.
          return String(value);

        case 'object':
          // If the type is 'object', we might be dealing with an object or an array or
          // null.
          // Due to a specification blunder in ECMAScript, typeof null is 'object',
          // so watch out for that case.
          if (!value) {
            return 'null';
          }
          if ((this.PHPJS_Resource && value instanceof this.PHPJS_Resource) || (window.PHPJS_Resource &&
            value instanceof window.PHPJS_Resource)) {
            throw new SyntaxError('json_encode');
          }

          // Make an array to hold the partial results of stringifying this object value.
          gap += indent;
          partial = [];

          // Is the value an array?
          if (Object.prototype.toString.apply(value) === '[object Array]') {
            // The value is an array. Stringify every element. Use null as a placeholder
            // for non-JSON values.
            length = value.length;
            for (i = 0; i < length; i += 1) {
              partial[i] = str(i, value) || 'null';
            }

            // Join all of the elements together, separated with commas, and wrap them in
            // brackets.
            v = partial.length === 0 ? '[]' : gap ? '[\n' + gap + partial.join(',\n' + gap) + '\n' + mind +
              ']' : '[' + partial.join(',') + ']';
            gap = mind;
            return v;
          }

          // Iterate through all of the keys in the object.
          for (k in value) {
            if (Object.hasOwnProperty.call(value, k)) {
              v = str(k, value);
              if (v) {
                partial.push(quote(k) + (gap ? ': ' : ':') + v);
              }
            }
          }

          // Join all of the member texts together, separated with commas,
          // and wrap them in braces.
          v = partial.length === 0 ? '{}' : gap ? '{\n' + gap + partial.join(',\n' + gap) + '\n' + mind + '}' :
            '{' + partial.join(',') + '}';
          gap = mind;
          return v;
        case 'undefined':
          // Fall-through
        case 'function':
          // Fall-through
        default:
          throw new SyntaxError('json_encode');
      }
    };

    // Make a fake root object containing our value under the key of ''.
    // Return the result of stringifying the value.
    return str('', {
      '': value
    });

  } catch (err) { // Todo: ensure error handling above throws a SyntaxError in all cases where it could
    // (i.e., when the JSON global is not available and there is an error)
    if (!(err instanceof SyntaxError)) {
      throw new Error('Unexpected error type in json_encode()');
    }
    this.php_js = this.php_js || {};
    this.php_js.last_error_json = 4; // usable by json_last_error()
    return null;
  }
}

function array_filter(arr, func) {
  //  discuss at: http://phpjs.org/functions/array_filter/
  // original by: Brett Zamir (http://brett-zamir.me)
  //    input by: max4ever
  // improved by: Brett Zamir (http://brett-zamir.me)
  //        note: Takes a function as an argument, not a function's name
  //   example 1: var odd = function (num) {return (num & 1);};
  //   example 1: array_filter({"a": 1, "b": 2, "c": 3, "d": 4, "e": 5}, odd);
  //   returns 1: {"a": 1, "c": 3, "e": 5}
  //   example 2: var even = function (num) {return (!(num & 1));}
  //   example 2: array_filter([6, 7, 8, 9, 10, 11, 12], even);
  //   returns 2: {0: 6, 2: 8, 4: 10, 6: 12}
  //   example 3: array_filter({"a": 1, "b": false, "c": -1, "d": 0, "e": null, "f":'', "g":undefined});
  //   returns 3: {"a":1, "c":-1};

  var retObj = {},
    k;

  func = func || function(v) {
    return v;
  };

  // Fix: Issue #73
  if (Object.prototype.toString.call(arr) === '[object Array]') {
    retObj = [];
  }

  for (k in arr) {
    if (func(arr[k])) {
      retObj[k] = arr[k];
    }
  }

  return retObj;
}

function array_search(needle, haystack, argStrict) {
  //  discuss at: http://phpjs.org/functions/array_search/
  // original by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
  //    input by: Brett Zamir (http://brett-zamir.me)
  // bugfixed by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
  //  depends on: array
  //        test: skip
  //   example 1: array_search('zonneveld', {firstname: 'kevin', middle: 'van', surname: 'zonneveld'});
  //   returns 1: 'surname'
  //   example 2: ini_set('phpjs.return_phpjs_arrays', 'on');
  //   example 2: var ordered_arr = array({3:'value'}, {2:'value'}, {'a':'value'}, {'b':'value'});
  //   example 2: var key = array_search(/val/g, ordered_arr); // or var key = ordered_arr.search(/val/g);
  //   returns 2: '3'

  var strict = !! argStrict,
    key = '';

  if (haystack && typeof haystack === 'object' && haystack.change_key_case) { // Duck-type check for our own array()-created PHPJS_Array
    return haystack.search(needle, argStrict);
  }
  if (typeof needle === 'object' && needle.exec) { // Duck-type for RegExp
    if (!strict) { // Let's consider case sensitive searches as strict
      var flags = 'i' + (needle.global ? 'g' : '') +
        (needle.multiline ? 'm' : '') +
        (needle.sticky ? 'y' : ''); // sticky is FF only
      needle = new RegExp(needle.source, flags);
    }
    for (key in haystack) {
      if (needle.test(haystack[key])) {
        return key;
      }
    }
    return false;
  }

  for (key in haystack) {
    if ((strict && haystack[key] === needle) || (!strict && haystack[key] == needle)) {
      return key;
    }
  }

  return false;
}

function array_unique(inputArr) {
  //  discuss at: http://phpjs.org/functions/array_unique/
  // original by: Carlos R. L. Rodrigues (http://www.jsfromhell.com)
  //    input by: duncan
  //    input by: Brett Zamir (http://brett-zamir.me)
  // bugfixed by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
  // bugfixed by: Nate
  // bugfixed by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
  // bugfixed by: Brett Zamir (http://brett-zamir.me)
  // improved by: Michael Grier
  //        note: The second argument, sort_flags is not implemented;
  //        note: also should be sorted (asort?) first according to docs
  //   example 1: array_unique(['Kevin','Kevin','van','Zonneveld','Kevin']);
  //   returns 1: {0: 'Kevin', 2: 'van', 3: 'Zonneveld'}
  //   example 2: array_unique({'a': 'green', 0: 'red', 'b': 'green', 1: 'blue', 2: 'red'});
  //   returns 2: {a: 'green', 0: 'red', 1: 'blue'}

  var key = '',
    tmp_arr2 = {},
    val = '';

  var __array_search = function(needle, haystack) {
    var fkey = '';
    for (fkey in haystack) {
      if (haystack.hasOwnProperty(fkey)) {
        if ((haystack[fkey] + '') === (needle + '')) {
          return fkey;
        }
      }
    }
    return false;
  };

  for (key in inputArr) {
    if (inputArr.hasOwnProperty(key)) {
      val = inputArr[key];
      if (false === __array_search(val, tmp_arr2)) {
        tmp_arr2[key] = val;
      }
    }
  }

  return tmp_arr2;
}

function array_push(inputArr) {
  //  discuss at: http://phpjs.org/functions/array_push/
  // original by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
  // improved by: Brett Zamir (http://brett-zamir.me)
  //        note: Note also that IE retains information about property position even
  //        note: after being supposedly deleted, so if you delete properties and then
  //        note: add back properties with the same keys (including numeric) that had
  //        note: been deleted, the order will be as before; thus, this function is not
  //        note: really recommended with associative arrays (objects) in IE environments
  //   example 1: array_push(['kevin','van'], 'zonneveld');
  //   returns 1: 3

  var i = 0,
    pr = '',
    argv = arguments,
    argc = argv.length,
    allDigits = /^\d$/,
    size = 0,
    highestIdx = 0,
    len = 0;
  if (inputArr.hasOwnProperty('length')) {
    for (i = 1; i < argc; i++) {
      inputArr[inputArr.length] = argv[i];
    }
    return inputArr.length;
  }

  // Associative (object)
  for (pr in inputArr) {
    if (inputArr.hasOwnProperty(pr)) {
      ++len;
      if (pr.search(allDigits) !== -1) {
        size = parseInt(pr, 10);
        highestIdx = size > highestIdx ? size : highestIdx;
      }
    }
  }
  for (i = 1; i < argc; i++) {
    inputArr[++highestIdx] = argv[i];
  }
  return len + i - 1;
}

function array_pop(inputArr) {
  //  discuss at: http://phpjs.org/functions/array_pop/
  // original by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
  // improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
  //    input by: Brett Zamir (http://brett-zamir.me)
  //    input by: Theriault
  // bugfixed by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
  // bugfixed by: Brett Zamir (http://brett-zamir.me)
  //        note: While IE (and other browsers) support iterating an object's
  //        note: own properties in order, if one attempts to add back properties
  //        note: in IE, they may end up in their former position due to their position
  //        note: being retained. So use of this function with "associative arrays"
  //        note: (objects) may lead to unexpected behavior in an IE environment if
  //        note: you add back properties with the same keys that you removed
  //   example 1: array_pop([0,1,2]);
  //   returns 1: 2
  //   example 2: data = {firstName: 'Kevin', surName: 'van Zonneveld'};
  //   example 2: lastElem = array_pop(data);
  //   example 2: $result = data
  //   returns 2: {firstName: 'Kevin'}

  var key = '',
    lastKey = '';

  if (inputArr.hasOwnProperty('length')) {
    // Indexed
    if (!inputArr.length) {
      // Done popping, are we?
      return null;
    }
    return inputArr.pop();
  } else {
    // Associative
    for (key in inputArr) {
      if (inputArr.hasOwnProperty(key)) {
        lastKey = key;
      }
    }
    if (lastKey) {
      var tmp = inputArr[lastKey];
      delete(inputArr[lastKey]);
      return tmp;
    } else {
      return null;
    }
  }
}

function array_merge() {
  //  discuss at: http://phpjs.org/functions/array_merge/
  // original by: Brett Zamir (http://brett-zamir.me)
  // bugfixed by: Nate
  // bugfixed by: Brett Zamir (http://brett-zamir.me)
  //    input by: josh
  //   example 1: arr1 = {"color": "red", 0: 2, 1: 4}
  //   example 1: arr2 = {0: "a", 1: "b", "color": "green", "shape": "trapezoid", 2: 4}
  //   example 1: array_merge(arr1, arr2)
  //   returns 1: {"color": "green", 0: 2, 1: 4, 2: "a", 3: "b", "shape": "trapezoid", 4: 4}
  //   example 2: arr1 = []
  //   example 2: arr2 = {1: "data"}
  //   example 2: array_merge(arr1, arr2)
  //   returns 2: {0: "data"}

  var args = Array.prototype.slice.call(arguments),
    argl = args.length,
    arg,
    retObj = {},
    k = '',
    argil = 0,
    j = 0,
    i = 0,
    ct = 0,
    toStr = Object.prototype.toString,
    retArr = true;

  for (i = 0; i < argl; i++) {
    if (toStr.call(args[i]) !== '[object Array]') {
      retArr = false;
      break;
    }
  }

  if (retArr) {
    retArr = [];
    for (i = 0; i < argl; i++) {
      retArr = retArr.concat(args[i]);
    }
    return retArr;
  }

  for (i = 0, ct = 0; i < argl; i++) {
    arg = args[i];
    if (toStr.call(arg) === '[object Array]') {
      for (j = 0, argil = arg.length; j < argil; j++) {
        retObj[ct++] = arg[j];
      }
    } else {
      for (k in arg) {
        if (arg.hasOwnProperty(k)) {
          if (parseInt(k, 10) + '' === k) {
            retObj[ct++] = arg[k];
          } else {
            retObj[k] = arg[k];
          }
        }
      }
    }
  }
  return retObj;
}

function array_shift(inputArr) {
  //  discuss at: http://phpjs.org/functions/array_shift/
  // original by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
  // improved by: Martijn Wieringa
  //        note: Currently does not handle objects
  //   example 1: array_shift(['Kevin', 'van', 'Zonneveld']);
  //   returns 1: 'Kevin'

  var props = false,
    shift = undefined,
    pr = '',
    allDigits = /^\d$/,
    int_ct = -1,
    _checkToUpIndices = function(arr, ct, key) {
      // Deal with situation, e.g., if encounter index 4 and try to set it to 0, but 0 exists later in loop (need to
      // increment all subsequent (skipping current key, since we need its value below) until find unused)
      if (arr[ct] !== undefined) {
        var tmp = ct;
        ct += 1;
        if (ct === key) {
          ct += 1;
        }
        ct = _checkToUpIndices(arr, ct, key);
        arr[ct] = arr[tmp];
        delete arr[tmp];
      }
      return ct;
    };

  if (inputArr.length === 0) {
    return null;
  }
  if (inputArr.length > 0) {
    return inputArr.shift();
  }

  /*
  UNFINISHED FOR HANDLING OBJECTS
  for (pr in inputArr) {
    if (inputArr.hasOwnProperty(pr)) {
      props = true;
      shift = inputArr[pr];
      delete inputArr[pr];
      break;
    }
  }
  for (pr in inputArr) {
    if (inputArr.hasOwnProperty(pr)) {
      if (pr.search(allDigits) !== -1) {
        int_ct += 1;
        if (parseInt(pr, 10) === int_ct) { // Key is already numbered ok, so don't need to change key for value
          continue;
        }
        _checkToUpIndices(inputArr, int_ct, pr);
        arr[int_ct] = arr[pr];
        delete arr[pr];
      }
    }
  }
  if (!props) {
    return null;
  }
  return shift;
  */
}


function date(format, timestamp) {
  //  discuss at: http://phpjs.org/functions/date/
  // original by: Carlos R. L. Rodrigues (http://www.jsfromhell.com)
  // original by: gettimeofday
  //    parts by: Peter-Paul Koch (http://www.quirksmode.org/js/beat.html)
  // improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
  // improved by: MeEtc (http://yass.meetcweb.com)
  // improved by: Brad Touesnard
  // improved by: Tim Wiel
  // improved by: Bryan Elliott
  // improved by: David Randall
  // improved by: Theriault
  // improved by: Theriault
  // improved by: Brett Zamir (http://brett-zamir.me)
  // improved by: Theriault
  // improved by: Thomas Beaucourt (http://www.webapp.fr)
  // improved by: JT
  // improved by: Theriault
  // improved by: Rafał Kukawski (http://blog.kukawski.pl)
  // improved by: Theriault
  //    input by: Brett Zamir (http://brett-zamir.me)
  //    input by: majak
  //    input by: Alex
  //    input by: Martin
  //    input by: Alex Wilson
  //    input by: Haravikk
  // bugfixed by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
  // bugfixed by: majak
  // bugfixed by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
  // bugfixed by: Brett Zamir (http://brett-zamir.me)
  // bugfixed by: omid (http://phpjs.org/functions/380:380#comment_137122)
  // bugfixed by: Chris (http://www.devotis.nl/)
  //        note: Uses global: php_js to store the default timezone
  //        note: Although the function potentially allows timezone info (see notes), it currently does not set
  //        note: per a timezone specified by date_default_timezone_set(). Implementers might use
  //        note: this.php_js.currentTimezoneOffset and this.php_js.currentTimezoneDST set by that function
  //        note: in order to adjust the dates in this function (or our other date functions!) accordingly
  //   example 1: date('H:m:s \\m \\i\\s \\m\\o\\n\\t\\h', 1062402400);
  //   returns 1: '09:09:40 m is month'
  //   example 2: date('F j, Y, g:i a', 1062462400);
  //   returns 2: 'September 2, 2003, 2:26 am'
  //   example 3: date('Y W o', 1062462400);
  //   returns 3: '2003 36 2003'
  //   example 4: x = date('Y m d', (new Date()).getTime()/1000);
  //   example 4: (x+'').length == 10 // 2009 01 09
  //   returns 4: true
  //   example 5: date('W', 1104534000);
  //   returns 5: '53'
  //   example 6: date('B t', 1104534000);
  //   returns 6: '999 31'
  //   example 7: date('W U', 1293750000.82); // 2010-12-31
  //   returns 7: '52 1293750000'
  //   example 8: date('W', 1293836400); // 2011-01-01
  //   returns 8: '52'
  //   example 9: date('W Y-m-d', 1293974054); // 2011-01-02
  //   returns 9: '52 2011-01-02'

  var that = this;
  var jsdate, f;
  // Keep this here (works, but for code commented-out below for file size reasons)
  // var tal= [];
  var txt_words = [
    'Sun', 'Mon', 'Tues', 'Wednes', 'Thurs', 'Fri', 'Satur',
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  // trailing backslash -> (dropped)
  // a backslash followed by any character (including backslash) -> the character
  // empty string -> empty string
  var formatChr = /\\?(.?)/gi;
  var formatChrCb = function(t, s) {
    return f[t] ? f[t]() : s;
  };
  var _pad = function(n, c) {
    n = String(n);
    while (n.length < c) {
      n = '0' + n;
    }
    return n;
  };
  f = {
    // Day
    d: function() { // Day of month w/leading 0; 01..31
      return _pad(f.j(), 2);
    },
    D: function() { // Shorthand day name; Mon...Sun
      return f.l()
        .slice(0, 3);
    },
    j: function() { // Day of month; 1..31
      return jsdate.getDate();
    },
    l: function() { // Full day name; Monday...Sunday
      return txt_words[f.w()] + 'day';
    },
    N: function() { // ISO-8601 day of week; 1[Mon]..7[Sun]
      return f.w() || 7;
    },
    S: function() { // Ordinal suffix for day of month; st, nd, rd, th
      var j = f.j();
      var i = j % 10;
      if (i <= 3 && parseInt((j % 100) / 10, 10) == 1) {
        i = 0;
      }
      return ['st', 'nd', 'rd'][i - 1] || 'th';
    },
    w: function() { // Day of week; 0[Sun]..6[Sat]
      return jsdate.getDay();
    },
    z: function() { // Day of year; 0..365
      var a = new Date(f.Y(), f.n() - 1, f.j());
      var b = new Date(f.Y(), 0, 1);
      return Math.round((a - b) / 864e5);
    },

    // Week
    W: function() { // ISO-8601 week number
      var a = new Date(f.Y(), f.n() - 1, f.j() - f.N() + 3);
      var b = new Date(a.getFullYear(), 0, 4);
      return _pad(1 + Math.round((a - b) / 864e5 / 7), 2);
    },

    // Month
    F: function() { // Full month name; January...December
      return txt_words[6 + f.n()];
    },
    m: function() { // Month w/leading 0; 01...12
      return _pad(f.n(), 2);
    },
    M: function() { // Shorthand month name; Jan...Dec
      return f.F()
        .slice(0, 3);
    },
    n: function() { // Month; 1...12
      return jsdate.getMonth() + 1;
    },
    t: function() { // Days in month; 28...31
      return (new Date(f.Y(), f.n(), 0))
        .getDate();
    },

    // Year
    L: function() { // Is leap year?; 0 or 1
      var j = f.Y();
      return j % 4 === 0 & j % 100 !== 0 | j % 400 === 0;
    },
    o: function() { // ISO-8601 year
      var n = f.n();
      var W = f.W();
      var Y = f.Y();
      return Y + (n === 12 && W < 9 ? 1 : n === 1 && W > 9 ? -1 : 0);
    },
    Y: function() { // Full year; e.g. 1980...2010
      return jsdate.getFullYear();
    },
    y: function() { // Last two digits of year; 00...99
      return f.Y()
        .toString()
        .slice(-2);
    },

    // Time
    a: function() { // am or pm
      return jsdate.getHours() > 11 ? 'pm' : 'am';
    },
    A: function() { // AM or PM
      return f.a()
        .toUpperCase();
    },
    B: function() { // Swatch Internet time; 000..999
      var H = jsdate.getUTCHours() * 36e2;
      // Hours
      var i = jsdate.getUTCMinutes() * 60;
      // Minutes
      var s = jsdate.getUTCSeconds(); // Seconds
      return _pad(Math.floor((H + i + s + 36e2) / 86.4) % 1e3, 3);
    },
    g: function() { // 12-Hours; 1..12
      return f.G() % 12 || 12;
    },
    G: function() { // 24-Hours; 0..23
      return jsdate.getHours();
    },
    h: function() { // 12-Hours w/leading 0; 01..12
      return _pad(f.g(), 2);
    },
    H: function() { // 24-Hours w/leading 0; 00..23
      return _pad(f.G(), 2);
    },
    i: function() { // Minutes w/leading 0; 00..59
      return _pad(jsdate.getMinutes(), 2);
    },
    s: function() { // Seconds w/leading 0; 00..59
      return _pad(jsdate.getSeconds(), 2);
    },
    u: function() { // Microseconds; 000000-999000
      return _pad(jsdate.getMilliseconds() * 1000, 6);
    },

    // Timezone
    e: function() { // Timezone identifier; e.g. Atlantic/Azores, ...
      // The following works, but requires inclusion of the very large
      // timezone_abbreviations_list() function.
      /*              return that.date_default_timezone_get();
       */
      throw 'Not supported (see source code of date() for timezone on how to add support)';
    },
    I: function() { // DST observed?; 0 or 1
      // Compares Jan 1 minus Jan 1 UTC to Jul 1 minus Jul 1 UTC.
      // If they are not equal, then DST is observed.
      var a = new Date(f.Y(), 0);
      // Jan 1
      var c = Date.UTC(f.Y(), 0);
      // Jan 1 UTC
      var b = new Date(f.Y(), 6);
      // Jul 1
      var d = Date.UTC(f.Y(), 6); // Jul 1 UTC
      return ((a - c) !== (b - d)) ? 1 : 0;
    },
    O: function() { // Difference to GMT in hour format; e.g. +0200
      var tzo = jsdate.getTimezoneOffset();
      var a = Math.abs(tzo);
      return (tzo > 0 ? '-' : '+') + _pad(Math.floor(a / 60) * 100 + a % 60, 4);
    },
    P: function() { // Difference to GMT w/colon; e.g. +02:00
      var O = f.O();
      return (O.substr(0, 3) + ':' + O.substr(3, 2));
    },
    T: function() { // Timezone abbreviation; e.g. EST, MDT, ...
      // The following works, but requires inclusion of the very
      // large timezone_abbreviations_list() function.
      /*              var abbr, i, os, _default;
      if (!tal.length) {
        tal = that.timezone_abbreviations_list();
      }
      if (that.php_js && that.php_js.default_timezone) {
        _default = that.php_js.default_timezone;
        for (abbr in tal) {
          for (i = 0; i < tal[abbr].length; i++) {
            if (tal[abbr][i].timezone_id === _default) {
              return abbr.toUpperCase();
            }
          }
        }
      }
      for (abbr in tal) {
        for (i = 0; i < tal[abbr].length; i++) {
          os = -jsdate.getTimezoneOffset() * 60;
          if (tal[abbr][i].offset === os) {
            return abbr.toUpperCase();
          }
        }
      }
      */
      return 'UTC';
    },
    Z: function() { // Timezone offset in seconds (-43200...50400)
      return -jsdate.getTimezoneOffset() * 60;
    },

    // Full Date/Time
    c: function() { // ISO-8601 date.
      return 'Y-m-d\\TH:i:sP'.replace(formatChr, formatChrCb);
    },
    r: function() { // RFC 2822
      return 'D, d M Y H:i:s O'.replace(formatChr, formatChrCb);
    },
    U: function() { // Seconds since UNIX epoch
      return jsdate / 1000 | 0;
    }
  };
  this.date = function(format, timestamp) {
    that = this;
    jsdate = (timestamp === undefined ? new Date() : // Not provided
      (timestamp instanceof Date) ? new Date(timestamp) : // JS Date()
      new Date(timestamp * 1000) // UNIX timestamp (auto-convert to int)
    );
    return format.replace(formatChr, formatChrCb);
  };
  return this.date(format, timestamp);
}


function strtotime(text, now) {
  //  discuss at: http://phpjs.org/functions/strtotime/
  //     version: 1109.2016
  // original by: Caio Ariede (http://caioariede.com)
  // improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
  // improved by: Caio Ariede (http://caioariede.com)
  // improved by: A. Matías Quezada (http://amatiasq.com)
  // improved by: preuter
  // improved by: Brett Zamir (http://brett-zamir.me)
  // improved by: Mirko Faber
  //    input by: David
  // bugfixed by: Wagner B. Soares
  // bugfixed by: Artur Tchernychev
  //        note: Examples all have a fixed timestamp to prevent tests to fail because of variable time(zones)
  //   example 1: strtotime('+1 day', 1129633200);
  //   returns 1: 1129719600
  //   example 2: strtotime('+1 week 2 days 4 hours 2 seconds', 1129633200);
  //   returns 2: 1130425202
  //   example 3: strtotime('last month', 1129633200);
  //   returns 3: 1127041200
  //   example 4: strtotime('2009-05-04 08:30:00 GMT');
  //   returns 4: 1241425800

  var parsed, match, today, year, date, days, ranges, len, times, regex, i, fail = false;

  if (!text) {
    return fail;
  }

  // Unecessary spaces
  text = text.replace(/^\s+|\s+$/g, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/[\t\r\n]/g, '')
    .toLowerCase();

  // in contrast to php, js Date.parse function interprets:
  // dates given as yyyy-mm-dd as in timezone: UTC,
  // dates with "." or "-" as MDY instead of DMY
  // dates with two-digit years differently
  // etc...etc...
  // ...therefore we manually parse lots of common date formats
  match = text.match(
    /^(\d{1,4})([\-\.\/\:])(\d{1,2})([\-\.\/\:])(\d{1,4})(?:\s(\d{1,2}):(\d{2})?:?(\d{2})?)?(?:\s([A-Z]+)?)?$/);

  if (match && match[2] === match[4]) {
    if (match[1] > 1901) {
      switch (match[2]) {
        case '-':
          { // YYYY-M-D
            if (match[3] > 12 || match[5] > 31) {
              return fail;
            }

            return new Date(match[1], parseInt(match[3], 10) - 1, match[5],
              match[6] || 0, match[7] || 0, match[8] || 0, match[9] || 0) / 1000;
          }
        case '.':
          { // YYYY.M.D is not parsed by strtotime()
            return fail;
          }
        case '/':
          { // YYYY/M/D
            if (match[3] > 12 || match[5] > 31) {
              return fail;
            }

            return new Date(match[1], parseInt(match[3], 10) - 1, match[5],
              match[6] || 0, match[7] || 0, match[8] || 0, match[9] || 0) / 1000;
          }
      }
    } else if (match[5] > 1901) {
      switch (match[2]) {
        case '-':
          { // D-M-YYYY
            if (match[3] > 12 || match[1] > 31) {
              return fail;
            }

            return new Date(match[5], parseInt(match[3], 10) - 1, match[1],
              match[6] || 0, match[7] || 0, match[8] || 0, match[9] || 0) / 1000;
          }
        case '.':
          { // D.M.YYYY
            if (match[3] > 12 || match[1] > 31) {
              return fail;
            }

            return new Date(match[5], parseInt(match[3], 10) - 1, match[1],
              match[6] || 0, match[7] || 0, match[8] || 0, match[9] || 0) / 1000;
          }
        case '/':
          { // M/D/YYYY
            if (match[1] > 12 || match[3] > 31) {
              return fail;
            }

            return new Date(match[5], parseInt(match[1], 10) - 1, match[3],
              match[6] || 0, match[7] || 0, match[8] || 0, match[9] || 0) / 1000;
          }
      }
    } else {
      switch (match[2]) {
        case '-':
          { // YY-M-D
            if (match[3] > 12 || match[5] > 31 || (match[1] < 70 && match[1] > 38)) {
              return fail;
            }

            year = match[1] >= 0 && match[1] <= 38 ? +match[1] + 2000 : match[1];
            return new Date(year, parseInt(match[3], 10) - 1, match[5],
              match[6] || 0, match[7] || 0, match[8] || 0, match[9] || 0) / 1000;
          }
        case '.':
          { // D.M.YY or H.MM.SS
            if (match[5] >= 70) { // D.M.YY
              if (match[3] > 12 || match[1] > 31) {
                return fail;
              }

              return new Date(match[5], parseInt(match[3], 10) - 1, match[1],
                match[6] || 0, match[7] || 0, match[8] || 0, match[9] || 0) / 1000;
            }
            if (match[5] < 60 && !match[6]) { // H.MM.SS
              if (match[1] > 23 || match[3] > 59) {
                return fail;
              }

              today = new Date();
              return new Date(today.getFullYear(), today.getMonth(), today.getDate(),
                match[1] || 0, match[3] || 0, match[5] || 0, match[9] || 0) / 1000;
            }

            return fail; // invalid format, cannot be parsed
          }
        case '/':
          { // M/D/YY
            if (match[1] > 12 || match[3] > 31 || (match[5] < 70 && match[5] > 38)) {
              return fail;
            }

            year = match[5] >= 0 && match[5] <= 38 ? +match[5] + 2000 : match[5];
            return new Date(year, parseInt(match[1], 10) - 1, match[3],
              match[6] || 0, match[7] || 0, match[8] || 0, match[9] || 0) / 1000;
          }
        case ':':
          { // HH:MM:SS
            if (match[1] > 23 || match[3] > 59 || match[5] > 59) {
              return fail;
            }

            today = new Date();
            return new Date(today.getFullYear(), today.getMonth(), today.getDate(),
              match[1] || 0, match[3] || 0, match[5] || 0) / 1000;
          }
      }
    }
  }

  // other formats and "now" should be parsed by Date.parse()
  if (text === 'now') {
    return now === null || isNaN(now) ? new Date()
      .getTime() / 1000 | 0 : now | 0;
  }
  if (!isNaN(parsed = Date.parse(text))) {
    return parsed / 1000 | 0;
  }

  date = now ? new Date(now * 1000) : new Date();
  days = {
    'sun': 0,
    'mon': 1,
    'tue': 2,
    'wed': 3,
    'thu': 4,
    'fri': 5,
    'sat': 6
  };
  ranges = {
    'yea': 'FullYear',
    'mon': 'Month',
    'day': 'Date',
    'hou': 'Hours',
    'min': 'Minutes',
    'sec': 'Seconds'
  };

  function lastNext(type, range, modifier) {
    var diff, day = days[range];

    if (typeof day !== 'undefined') {
      diff = day - date.getDay();

      if (diff === 0) {
        diff = 7 * modifier;
      } else if (diff > 0 && type === 'last') {
        diff -= 7;
      } else if (diff < 0 && type === 'next') {
        diff += 7;
      }

      date.setDate(date.getDate() + diff);
    }
  }

  function process(val) {
    var splt = val.split(' '), // Todo: Reconcile this with regex using \s, taking into account browser issues with split and regexes
      type = splt[0],
      range = splt[1].substring(0, 3),
      typeIsNumber = /\d+/.test(type),
      ago = splt[2] === 'ago',
      num = (type === 'last' ? -1 : 1) * (ago ? -1 : 1);

    if (typeIsNumber) {
      num *= parseInt(type, 10);
    }

    if (ranges.hasOwnProperty(range) && !splt[1].match(/^mon(day|\.)?$/i)) {
      return date['set' + ranges[range]](date['get' + ranges[range]]() + num);
    }

    if (range === 'wee') {
      return date.setDate(date.getDate() + (num * 7));
    }

    if (type === 'next' || type === 'last') {
      lastNext(type, range, num);
    } else if (!typeIsNumber) {
      return false;
    }

    return true;
  }

  times = '(years?|months?|weeks?|days?|hours?|minutes?|min|seconds?|sec' +
    '|sunday|sun\\.?|monday|mon\\.?|tuesday|tue\\.?|wednesday|wed\\.?' +
    '|thursday|thu\\.?|friday|fri\\.?|saturday|sat\\.?)';
  regex = '([+-]?\\d+\\s' + times + '|' + '(last|next)\\s' + times + ')(\\sago)?';

  match = text.match(new RegExp(regex, 'gi'));
  if (!match) {
    return fail;
  }

  for (i = 0, len = match.length; i < len; i++) {
    if (!process(match[i])) {
      return fail;
    }
  }

  // ECMAScript 5 only
  // if (!match.every(process))
  //    return false;

  return (date.getTime() / 1000);
}


function date_parse(date) {
  //  discuss at: http://phpjs.org/functions/date_parse/
  // original by: Brett Zamir (http://brett-zamir.me)
  //  depends on: strtotime
  //   example 1: date_parse('2006-12-12 10:00:00.5');
  //   returns 1: {year : 2006, month: 12, day: 12, hour: 10, minute: 0, second: 0, fraction: 0.5, warning_count: 0, warnings: [], error_count: 0, errors: [], is_localtime: false}

  // BEGIN REDUNDANT
  this.php_js = this.php_js || {};
  // END REDUNDANT

  var ts,
    warningsOffset = this.php_js.warnings ? this.php_js.warnings.length : null,
    errorsOffset = this.php_js.errors ? this.php_js.errors.length : null;

  try {
    this.php_js.date_parse_state = true; // Allow strtotime to return a decimal (which it normally does not)
    ts = this.strtotime(date);
    this.php_js.date_parse_state = false;
  } finally {
    if (!ts) {
      return false;
    }
  }

  var dt = new Date(ts * 1000);

  var retObj = { // Grab any new warnings or errors added (not implemented yet in strtotime()); throwing warnings, notices, or errors could also be easily monitored by using 'watch' on this.php_js.latestWarning, etc. and/or calling any defined error handlers
    warning_count: warningsOffset !== null ? this.php_js.warnings.slice(warningsOffset)
      .length : 0,
    warnings: warningsOffset !== null ? this.php_js.warnings.slice(warningsOffset) : [],
    error_count: errorsOffset !== null ? this.php_js.errors.slice(errorsOffset)
      .length : 0,
    errors: errorsOffset !== null ? this.php_js.errors.slice(errorsOffset) : []
  };
  retObj.year = dt.getFullYear();
  retObj.month = dt.getMonth() + 1;
  retObj.day = dt.getDate();
  retObj.hour = dt.getHours();
  retObj.minute = dt.getMinutes();
  retObj.second = dt.getSeconds();
  retObj.fraction = parseFloat('0.' + dt.getMilliseconds());
  retObj.is_localtime = dt.getTimezoneOffset() !== 0;

  return retObj;
}

function microtime(get_as_float) {
  //  discuss at: http://phpjs.org/functions/microtime/
  // original by: Paulo Freitas
  //   example 1: timeStamp = microtime(true);
  //   example 1: timeStamp > 1000000000 && timeStamp < 2000000000
  //   returns 1: true

  var now = new Date()
    .getTime() / 1000;
  var s = parseInt(now, 10);

  return (get_as_float) ? now : (Math.round((now - s) * 1000) / 1000) + ' ' + s;
}

function getdate(timestamp) {
  //  discuss at: http://phpjs.org/functions/getdate/
  // original by: Paulo Freitas
  //    input by: Alex
  // bugfixed by: Brett Zamir (http://brett-zamir.me)
  //   example 1: getdate(1055901520);
  //   returns 1: {'seconds': 40, 'minutes': 58, 'hours': 21, 'mday': 17, 'wday': 2, 'mon': 6, 'year': 2003, 'yday': 167, 'weekday': 'Tuesday', 'month': 'June', '0': 1055901520}

  var _w = ['Sun', 'Mon', 'Tues', 'Wednes', 'Thurs', 'Fri', 'Satur'];
  var _m = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October',
    'November', 'December'
  ];
  var d = ((typeof timestamp === 'undefined') ? new Date() : // Not provided
    (typeof timestamp === 'object') ? new Date(timestamp) : // Javascript Date()
    new Date(timestamp * 1000) // UNIX timestamp (auto-convert to int)
  );
  var w = d.getDay();
  var m = d.getMonth();
  var y = d.getFullYear();
  var r = {};

  r.seconds = d.getSeconds();
  r.minutes = d.getMinutes();
  r.hours = d.getHours();
  r.mday = d.getDate();
  r.wday = w;
  r.mon = m + 1;
  r.year = y;
  r.yday = Math.floor((d - (new Date(y, 0, 1))) / 86400000);
  r.weekday = _w[w] + 'day';
  r.month = _m[m];
  r['0'] = parseInt(d.getTime() / 1000, 10);

  return r;
}

function time() {
  //  discuss at: http://phpjs.org/functions/time/
  // original by: GeekFG (http://geekfg.blogspot.com)
  // improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
  // improved by: metjay
  // improved by: HKM
  //   example 1: timeStamp = time();
  //   example 1: timeStamp > 1000000000 && timeStamp < 2000000000
  //   returns 1: true

  return Math.floor(new Date()
    .getTime() / 1000);
}